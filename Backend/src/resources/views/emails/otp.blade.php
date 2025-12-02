<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
      
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif;
            color: #3c4043;
            line-height: 1.6;
        }
        
        
        .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center; 
        }

       
        .headline {
            font-size: 24px;
            font-weight: 400;
            color: #202124;
            margin-bottom: 20px;
            margin-top: 0;
        }

     
        .message-body {
            font-size: 16px;
            color: #3c4043;
            margin-bottom: 30px;
            text-align: center; 
        }

        
        .code-container {
            margin: 30px 0;
        }
        .otp-code {
            display: inline-block;
            font-size: 40px;
            font-weight: bold;
            color: #1a73e8; 
            letter-spacing: 8px;
            padding: 10px 0;
        }

        .footer-text {
            font-size: 12px;
            color: #5f6368;
            margin-top: 40px;
            border-top: 1px solid #dadce0;
            padding-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="container">
        

        <h1 class="headline">Verification Code</h1>

        <div class="message-body">
            {!! nl2br(e($intro)) !!}
        </div>

        <div class="code-container">
            <span class="otp-code">{{ $code }}</span>
        </div>

        <div class="message-body">
            {!! nl2br(e($outro)) !!}
        </div>

        <div class="footer-text">
            &copy; {{ date('Y') }} Jake Store. All rights reserved.
        </div>

    </div>

</body>
</html>