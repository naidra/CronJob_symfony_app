(function () {
	'use strict';
	// ------------------------------------------------------- //
	// Calendar
	// ------------------------------------------------------ //
	$(function() {
		// page is ready
		const viewEventModal = $('#modal-view-event');
		const addEventModal = $('#modal-view-event-add');
		const editEventModal = $('#modal-view-event-edit');
		const terminePageCalendarSpinner = document.querySelector('.termine-page .calendar-loader');

		function fixTimezoneDifference(startDate, endDate) {
			const sD = new Date(startDate);
			let eD = new Date(endDate);
			const timeZoneoffset = Math.abs(sD.getTimezoneOffset()) / 60;
			sD.setHours(sD.getHours() - timeZoneoffset);
			eD.setHours(eD.getHours() - timeZoneoffset);
			if(!endDate) eD = null;
			return ['month'].includes(calendar.fullCalendar('getView').name) ? [sD, eD] : [startDate, endDate];
		}

		function formatCustomDate(dates){
			const [start, end] = dates.split(' - ');
			const [ dateStart, timeStart] = start.trim().split(' ');
			const [ dateEnd, timeEnd] = (end || '').trim().split(' ');
			const [ sDay, sMonth, sYear ] = dateStart.split('.');
			const [ sHour, sMinutes ] = timeStart.split(':');
			const [ eDay, eMonth, eYear ] = (dateEnd || '').split('.');
			const [ eHour, eMinutes ] = (timeEnd || '').split(':');
			return { sDay, sMonth, sYear, sHour, sMinutes, eDay, eMonth, eYear, eHour, eMinutes, start, end };
		}

		function getEvent(form){
			const values = Array.from(form.querySelectorAll('input, select, textarea')).reduce((acc, el) => {
				acc[el.name] = el.value;
				return acc;
			}, (document.querySelector('#modal-view-event').event_data || {}));
			// const { sDay, sMonth, sYear, sHour, sMinutes, eDay, eMonth, eYear, eHour, eMinutes, end } = formatCustomDate(values.dates);
			// const eDayUpdate = (calendar.fullCalendar('getView').name === 'month') ? (eDay - 1) : eDay;
			// values.start = moment(new Date(sYear, (sMonth - 1), sDay, sHour, sMinutes, 0));
			// values.end = moment(new Date(eYear, (eMonth - 1), eDay, eHour, eMinutes, 0));
			values.start = values.dates1 ? new Date(values.dates1) : null;
			values.end = values.dates2 ? new Date(values.dates2) : null;
			values.allDay = !values.dates2;
			console.log('values', values);
			return values;
		}

		const calendar = $('#calendar').fullCalendar({
			themeSystem: 'bootstrap4',
			businessHours: false,
			defaultView: 'month',
			editable: true,
			startEditable: true,
			eventLimit: 2,
			selectable: true,
			locale: 'de',
			eventTextColor: '#FFF',
			timezone: 'local',
			events: events_list,
			header: {
				left: 'title',
				center: 'month,agendaWeek,agendaDay',
				right: 'today prev,next'
			},
			select: function({ _d: startDate }, { _d: endDate }){
				// startDate.setMinutes(startDate.getMinutes() + 1);
				const [sD, eD] = fixTimezoneDifference(startDate, endDate);
				$('.datetime1picker').data('datepicker').selectDate(sD);
				$('.datetime2picker').data('datepicker').selectDate(eD);
				addEventModal.modal();
			},
			eventResize: async function(event, { _days }) {
				const formData = new FormData();
				formData.append('action', 'update');
				const srvEvent = { ...event, e_id: event.e_id, start: event.start._d, end: event.end._d, source: null };
				formData.append('data', JSON.stringify(srvEvent));
				terminePageCalendarSpinner.style.setProperty('display', 'flex');
				const postData = await fetch('./termine', { method: "POST", body: formData });
				terminePageCalendarSpinner.style.setProperty('display', 'none');
				console.log('Event resized: ', srvEvent);
			},
			eventDrop: async function(event) {
				const formData = new FormData();
				formData.append('action', 'update');
				const srvEvent = { ...event, e_id: event.e_id, start: event.start._d, end: event.end._d, source: null };
				formData.append('data', JSON.stringify(srvEvent));
				terminePageCalendarSpinner.style.setProperty('display', 'flex');
				const postData = await fetch('./termine', { method: "POST", body: formData });
				terminePageCalendarSpinner.style.setProperty('display', 'none');
				console.log('Event moved: ', srvEvent);
			},
			eventRender: function(event, element) {
				if(event.icon){
					element.find(".fc-title").prepend("<i class='fa primary-color-design fa-"+event.icon+"'></i>");
				}
			},
			dayClick: function() {
				addEventModal.modal();
			},
			eventClick: function(event, jsEvent, view) {
				$('.event-title').html(event.title);
				$('.event-body').html(event.description);
				$('.eventUrl').attr('href', event.url);
				document.querySelector('#modal-view-event').event_data = event;
				viewEventModal.modal('show');
			}
		});
		
		$('.datetime1picker, .datetime1pickeredit, .datetime2picker, .datetime2pickeredit').datepicker({
			timepicker: true,
			language: 'de',
			dateFormat: 'mm/dd/yyyy',
    		// timeFormat: 'hh:mm AA',
			// range: true,
			// multipleDates: true,
			// multipleDatesSeparator: " - "
		});
		$("#add-event").submit(async function(e){
			e.preventDefault();
			const event = getEvent(this);
			const formData = new FormData();
			formData.append('action', 'insert');
			const srvEvent = { ...event, source: null };
			terminePageCalendarSpinner.style.setProperty('display', 'flex');
			addEventModal.modal('hide');
			if(!srvEvent.index) {
				const formData = new FormData();
				formData.append('action', 'getEventsCount');
				formData.append('data', '');
				const postData = await fetch('./termine', { method: "POST", body: formData });
				const index = await postData.text();
				event.index = index;
			}
			formData.append('data', JSON.stringify(srvEvent));
			const postData = await fetch('./termine', { method: "POST", body: formData });
			terminePageCalendarSpinner.style.setProperty('display', 'none');
			if(postData.ok) calendar.fullCalendar('renderEvent', event, true);
		});
		$("#edit-event").submit(async function(e){
			e.preventDefault();
			const event = getEvent(this);
			const formData = new FormData();
			formData.append('action', 'update');
			formData.append('data', JSON.stringify({ ...event, e_id: event.e_id, source: null }));
			terminePageCalendarSpinner.style.setProperty('display', 'flex');
			editEventModal.modal('hide');
			viewEventModal.modal('hide');
			const postData = await fetch('./termine', { method: "POST", body: formData });
			terminePageCalendarSpinner.style.setProperty('display', 'none');
			if(postData.ok) calendar.fullCalendar('updateEvent', event);
		});
		addEventModal.on('hidden.bs.modal', function () {
			document.querySelector("#add-event").reset();
		});
		
		editEventModal.on('show.bs.modal', function () {
			const event = document.querySelector('#modal-view-event').event_data;
			const names = Object.keys(event);
			names.forEach(name => {
				const input = document.querySelectorAll(`#edit-event input[name="${name}"], #edit-event select[name="${name}"], #edit-event textarea[name="${name}"]`);
				if(input.length) {
					const inputTag = input[0];
					inputTag.value = event[name];
					if(name === 'color') {
						inputTag.nextElementSibling.style.setProperty('background-color', event[name]);
						inputTag.nextElementSibling.style.setProperty('border-color', event[name]);
					}
				}
			});
			const endDate = event.end ? event.end._d : null;
			// if(endDate) endDate.setDate(endDate.getDate() - 1);
			$('.datetime1pickeredit').data('datepicker').selectDate(event.start._d);
			$('.datetime2pickeredit').data('datepicker').selectDate(endDate);
			viewEventModal.modal('hide');
		});
		editEventModal.on('hidden.bs.modal', function () {
			document.querySelector("#edit-event").reset();
			document.querySelector('#modal-view-event').event_data = null;
		});

		document.querySelector('.delete-event-btn').addEventListener('click', async function(e) {
			const event = document.querySelector('#modal-view-event').event_data;
			const formData = new FormData();
			formData.append('action', 'delete');
			formData.append('data', JSON.stringify({ index: event.index, e_id: event.e_id }));
			terminePageCalendarSpinner.style.setProperty('display', 'flex');
			viewEventModal.modal('hide');
			const postData = await fetch('./termine', { method: "POST", body: formData });
			terminePageCalendarSpinner.style.setProperty('display', 'none');
			if(postData.ok && event) calendar.fullCalendar('removeEvents', event._id);
		});
		
		document.querySelector('.edit-event-btn').addEventListener('click', function(e) {
			viewEventModal.modal('hide');
			editEventModal.modal('show');
		});
		
		// Set header on another div wrapper
		document.querySelector('.termine-page .calendar-header-content').appendChild(document.querySelector('.termine-page .fc-header-toolbar'));

		$("#colorpicker1, #colorpicker2").colorPick({
			initialColor : event_colors[0],
			// palette: ["#02a9ff", "#feba3c", "#9d5efd", "#fe5581", "#04bc9f", "#bbdd00", "#9f9f9f", "#ff4040"],
			palette: event_colors,
			allowRecent: false,
			onColorSelected: function() {
				this.element.css({'backgroundColor': this.color, 'color': this.color});
				$('[name="color"]', this.element.parent()).val(this.color);
			}
		});
	});
})();