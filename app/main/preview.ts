export const PREVIEW_DEFAULT_MARKUP =`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        html, body {
            height: 100%;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            margin: auto !important;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2em;
            box-sizing: border-box;
            border: 2px dashed rgba(0,0,0,0.3);
        }

        .placeholder {
            text-transform: uppercase;
            font-size: 45px;
            transform: rotate(-45deg);
            opacity: .3;
        }
    </style>

</head>
<body>
    <div class="placeholder">preview</div>
</body>
</html>
`;
