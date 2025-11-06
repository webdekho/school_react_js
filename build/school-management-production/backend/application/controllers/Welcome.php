<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Welcome extends CI_Controller {

    public $db;
    public $session;
    public $form_validation;

    public function index()
    {
        $data = array(
            'status' => 'success',
            'message' => 'School Management System API is running',
            'version' => '1.0.0',
            'endpoints' => array(
                'auth' => '/api/auth/login',
                'admin' => '/api/admin/*',
                'staff' => '/api/staff/*',
                'parent' => '/api/parent/*'
            )
        );
        
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}