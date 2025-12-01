<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $code;
    public $intro;
    public $outro;

    /**
     * Create a new message instance.
     */
    public function __construct($code, $intro, $outro)
    {
        $this->code = $code;
        $this->intro = $intro;
        $this->outro = $outro;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Verification Code')
                    ->view('emails.otp');
    }
}