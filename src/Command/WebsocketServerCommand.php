<?php
namespace App\Command;
 
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use App\Websocket\MessageHandler;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use React\EventLoop\Factory as LoopFactory;

class WebsocketServerCommand extends Command
{
    protected static $defaultName = "run:websocket-server";

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $port = 3001;
        $loop = LoopFactory::create();
        $output->writeln("Starting server on port " . $port);
        $msgHandler = new MessageHandler();
        $server = IoServer::factory(
            new HttpServer(
                new WsServer(
                    $msgHandler
                )
            ),
            $port
        );
        $server->loop->addPeriodicTimer(5, function () use ($msgHandler, $output) {
            // $msg = "Websocket server time: " . time();
            $msgHandler->pushMsgToAll($output);
        });
        
        $server->run();
        return 0;
    }
}