<?php
// Clear logs
$logFile = '/Applications/XAMPP/xamppfiles/htdocs/School/api_intercept.log';

if (file_exists($logFile)) {
    file_put_contents($logFile, '');
}

echo "Logs cleared";
?>