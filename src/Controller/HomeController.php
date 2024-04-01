<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Session\Session;
use App\Controller\DBConnect;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Security;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Cache\Psr16Cache;
use Monolog\Logger;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Encoder\XmlEncoder;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;
use Aws\Resource\Aws;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use DateTime;
use Symfony\Component\HttpClient\HttpClient;

class HomeController extends DBConnect
{
    /**
     * @Route("/", name="app_firstpage")
     * @IsGranted("ROLE_MOBILUSER")
     */
    public function firstPage(Request $request, UserInterface $user)
    {
        // return $this->redirectToRoute('search_page');
        return $this->render('home/mobileIndex.html.twig', array());
    }

    /**
     * @Route("/homemobile", name="app_homepage_mobiluser")
     * @IsGranted("ROLE_MOBILUSER")
     */
    public function homePage(Request $request, UserInterface $user)
    {
        $userEmail = $user->getEmail();
        $find_sql = "SELECT * FROM `schedule_data` WHERE schedule_email = ?";
        $schedule_data = $this->DB()->fetchAllAssociative($find_sql, array($userEmail));
        return $this->render('home/mobileIndex.html.twig', array(
            "schedule_data" => $schedule_data
        ));
    }

    /**
     * @Route("/saveSchedule", name="save_schedule")
     * @IsGranted("ROLE_MOBILUSER")
     */
    public function saveSchedule(Request $request, UserInterface $user)
    {
        date_default_timezone_set('Europe/Berlin');

        if ($request->isMethod('POST')) {
            $email = $user->getEmail();
            $url = $request->request->get('url');
            $interval = $request->request->get('interval');
            $req_type = $request->request->get('req_type');
            $created_at = date('Y-m-d H:i:s');

            // save these data to database  id	schedule_url	schedule_email	schedule_interval	created_at
            $sql = "INSERT INTO `schedule_data` (schedule_url, schedule_email, schedule_interval, schedule_req_type, created_at) VALUES (?, ?, ?, ?, ?)";
            $this->DB()->executeQuery($sql, array($url, $email, $interval, $req_type, $created_at));
            
            return $this->redirectToRoute('app_homepage_mobiluser');
        }
    }

    /**
     * @Route("/deleteSchedule/{id}", name="delete_schedule")
     * @IsGranted("ROLE_MOBILUSER")
     */
    public function deleteSchedule(Request $request, UserInterface $user, $id)
    {
        $sql = "DELETE FROM `schedule_data` WHERE id = ?";
        $this->DB()->executeQuery($sql, array($id));

        return $this->redirectToRoute('app_homepage_mobiluser');
    }

    /**
     * @Route("/homeoffice", name="app_homepage_office")
     * @IsGranted("ROLE_ADMINOFFICE")
     */
    public function homeofficePage(Request $request, UserInterface $user)
    {
        // return $this->redirectToRoute('search_page');
        return $this->render('home/officeIndex.html.twig', array());
    }

    /**
     * @Route("/homeworkshop", name="app_homepage_workshop")
     * @IsGranted("ROLE_WORKSHOPEMPLOYEE")
     */
    public function homeworkshopPage(Request $request, UserInterface $user)
    {
        return $this->redirectToRoute('search_page');
        return $this->render('home/workshopIndex.html.twig', array());
    }
}