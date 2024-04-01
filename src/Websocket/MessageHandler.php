<?php
namespace App\Websocket;
 
use Exception;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use SplObjectStorage;
use PDO;
 
class MessageHandler implements MessageComponentInterface
{
    protected $connections;
    protected $DB_CONNECTION;
 
    public function __construct()
    {
        $this->connections = new SplObjectStorage;
        // Connect to database pdo php
        $this->DB_CONNECTION = new \PDO("mysql:host=127.0.0.1;dbname=cron_job_symfony_app_db", 'root', '');
        // $this->DB_CONNECTION = new \PDO("mysql:host=49.12.46.165;dbname=noxolocloud", 'noxolocloud3', '3XJK4bXsmpiWXVAEFdwM');
        $this->DB_CONNECTION->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->connections->attach($conn);
    }
 
    public function onMessage(ConnectionInterface $from, $msg)
    {
        foreach($this->connections as $connection)
        {
            if($connection === $from)
            {
                continue;
            }
            $connection->send($msg);
        }
    }

    public function pushMsgToAll($output)
    {
        // set timezone to berllin
        date_default_timezone_set('Europe/Berlin');
        $sth = $this->DB_CONNECTION->prepare("SELECT TABLE_NAME, UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE DATE_SUB(NOW(), INTERVAL 15 SECOND) < `UPDATE_TIME`");
        $sth->execute();
        $result_data = $sth->fetchAll(\PDO::FETCH_ASSOC);
        $tables_to_not_count = ["ALL_PLUGINS", "COLUMNS", "EVENTS", "OPTIMIZER_TRACE", "PARAMETERS", "PARTITIONS", "PLUGINS", "PROCESSLIST", "ROUTINES", "SYSTEM_VARIABLES", "TRIGGERS", "VIEWS", "pma__userconfig", "CHECK_CONSTRAINTS", "sensorecho", "innodb_table_stats", "innodb_index_stats"];
        $recently_changed_tables = array_filter($result_data, function($item) use ($tables_to_not_count){ return !in_array($item['TABLE_NAME'], $tables_to_not_count); });
        if(count($recently_changed_tables) > 0) {
            $data = array('tables_changed' => true, "tables" => $recently_changed_tables);
            foreach($this->connections as $connection){
                $connection->send(json_encode($data));
            }
        }

        $date = new \DateTime();
        $date->setTime($date->format('H'), 0, 0);
        $todays_date = $date->format('Y-m-d H:i:s');

        $sth2 = $this->DB_CONNECTION->prepare("SELECT * FROM schedule_data WHERE url_called_at IS NULL OR url_called_at < '$todays_date'");
        $sth2->execute();
        $stats_data = $sth2->fetchAll(\PDO::FETCH_ASSOC);

        foreach($stats_data as $stat_data) {
            $schedule_id = $stat_data['id'];
            $schedule_url = $stat_data['schedule_url'];
            $schedule_email = $stat_data['schedule_email'];
            $schedule_interval = $stat_data['schedule_interval'];
            $schedule_req_type = $stat_data['schedule_req_type'];
            $url_called_at = $stat_data['url_called_at'];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $schedule_url);
            if($schedule_req_type == 'GET') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            } else {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, []);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            }
            $server_output = curl_exec($ch);
            curl_close($ch);

            $url_called_at_is_null = $url_called_at == NULL;
            $date_to_send_email = $url_called_at_is_null ? (new \DateTime()) : (\DateTime::createFromFormat('Y-m-d H:i:s', $url_called_at));
            $date_to_send_email->setTime($date_to_send_email->format('H'), 0, 0);
            $date_to_send_email->modify("+$schedule_interval");
            $formatted_date_to_email_sent_at = $date_to_send_email->format('Y-m-d H:i:s');

            $sth3 = $this->DB_CONNECTION->prepare("UPDATE schedule_data SET url_called_at = '$formatted_date_to_email_sent_at' WHERE id = '$schedule_id'");
            $sth3->execute();
        }

        return $output->writeln("Stats data: " . json_encode($stats_data));
    }
 
    public function onClose(ConnectionInterface $conn)
    {
        $this->connections->detach($conn);
    }
 
    public function onError(ConnectionInterface $conn, Exception $e)
    {
        $this->connections->detach($conn);
        $conn->close();
    }
}