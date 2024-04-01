<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class SecurityController extends AbstractController
{
    /**
     * @Route("/login", name="app_login")
     */
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        // if ($this->getUser()) {
        //     return $this->redirectToRoute('app_homepage_one');
        // }

        // get the login error if there is one
        $error = $authenticationUtils->getLastAuthenticationError();
        // last username entered by the user
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('security/login.html.twig', ['last_username' => $lastUsername, 'error' => $error]);
    }

    /**
     * @Route("/redirectBasedOnRole", name="app_redirect_based_on_user_role")
     */
    public function redirect_based_on_role()
    {
        $user_role = $this->getUser()->getRoles();
        // if (in_array("ROLE_MOBILUSER", $user_role)) {
        //     return $this->redirectToRoute('app_homepage_mobiluser');
        // } else if (in_array("ROLE_ADMINOFFICE", $user_role)) {
        //     return $this->redirectToRoute('app_homepage_office');
        // } else if (in_array("ROLE_WORKSHOPEMPLOYEE", $user_role)) {
        //     return $this->redirectToRoute('app_homepage_workshop');
        // }

        return $this->redirectToRoute('app_homepage_mobiluser');
    }

    /**
     * @Route("/logout", name="app_logout")
     */
    public function logout()
    {
        throw new \LogicException('This method can be blank - it will be intercepted by the logout key on your firewall.');
        return $this->redirectToRoute('app_login');
    }
}
