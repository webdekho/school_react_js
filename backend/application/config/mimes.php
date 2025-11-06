<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| Custom MIME types for file uploads
| This file extends/overrides the default CodeIgniter MIME types
*/

return array(
    'jpg' => array('image/jpeg', 'image/pjpeg', 'image/jpg'),
    'jpeg' => array('image/jpeg', 'image/pjpeg', 'image/jpg'),
    'jpe' => array('image/jpeg', 'image/pjpeg', 'image/jpg'),
    'png' => array('image/png', 'image/x-png'),
    'gif' => array('image/gif'),
    'pdf' => array('application/pdf', 'application/x-pdf', 'application/acrobat', 'applications/vnd.pdf', 'text/pdf', 'text/x-pdf')
);

