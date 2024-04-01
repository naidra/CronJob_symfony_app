<?php
    namespace App\Controller;
    use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
    use Symfony\Component\HttpFoundation\RedirectResponse;
    use Symfony\Component\Security\Core\User\UserInterface;
    use Symfony\Component\HttpFoundation\Request;
    use Symfony\Component\HttpFoundation\Session\Session;
    use Doctrine\Persistence\ManagerRegistry;

    class DBConnect extends AbstractController {
        public function __construct(ManagerRegistry $doctrine) {
            $this->doctrine = $doctrine;
        }
        public function DB()
        {
            return $this->doctrine->getConnection('default');
        }
        public function userData($userEmail, $currentUrl)
        {
            $session = new Session();
            $db_connection = $this->doctrine->getConnection('default');
            $find_sql = "SELECT * FROM `user` WHERE email = ?";
            $userData = $db_connection->fetchAssociative($find_sql, array($userEmail));

            if ($userData['log_user_out'] == 1) {
                $find_sql = "UPDATE `user` SET log_user_out = 0 WHERE email = ?";
                $db_connection->executeQuery($find_sql, array($userEmail));
                $this->get('security.token_storage')->setToken(null);
                $this->get('session')->invalidate();
                $session->getFlashBag()->add('danger', array('message' => 'Logged out because of password reset, please log in again!'));
                return new RedirectResponse($this->generateUrl('app_logout'));
            }

            return $userData;
        }
        public function isSuperAdmin($userId)
        {
            $find_sql = "SELECT id FROM `user` WHERE email = ?";
            $sa_id_one = $this->DB()->fetchOne($find_sql, array('first_email@live.com'));
            $sa_id_two = $this->DB()->fetchOne($find_sql, array('second_email@live.com'));

            return ($userId == $sa_id_one || $userId == $sa_id_two); // if id-s don't match it returns false
        }
    }