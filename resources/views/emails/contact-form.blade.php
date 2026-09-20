<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Us Message</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0891b2, #1d4ed8); padding: 24px 32px;">
                            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">New Contact Us Message</h1>
                            <p style="color: #cffafe; font-size: 13px; margin: 4px 0 0;">Mejeck IcePlant website</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
                                <strong>Name:</strong> {{ $senderName }}
                            </p>
                            <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
                                <strong>Email:</strong> {{ $senderEmail }}
                            </p>
                            @if (!empty($senderPhone))
                                <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
                                    <strong>Phone:</strong> {{ $senderPhone }}
                                </p>
                            @endif
                            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Message:</strong></p>
                            <p style="margin: 0; font-size: 14px; color: #111827; white-space: pre-line; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">{{ $messageBody }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                Reply directly to this email to respond to {{ $senderName }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
