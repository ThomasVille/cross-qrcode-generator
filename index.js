function textToCode(text, htmlElement) {
    let qrcode = new QRCode(htmlElement, {
        width : 200,
        height : 200
    });

    qrcode.makeCode(text);
}

function cleanPrintZone() {
    let print_zone = document.getElementById("print_zone");
    print_zone.innerHTML = '';
}

function isUpperCase(str) {
    return str === str.toUpperCase();
}

function splitNames(fullname) {
    let names = fullname.split(' ');
    let lastname = names.filter(isUpperCase).join(' ');
    let firstname = names.filter(name => !isUpperCase(name)).join(' ');

    return [lastname, firstname];
}

function processCSVFile(file) {
    console.log(file);
    let content = document.getElementById('print_zone');
    let drop_zone = document.getElementById("drop_zone");
    let drop_zone_text = document.getElementById("drop_zone_text");
    drop_zone_text.innerText = "Génération des dossards en cours...";

    let reader = new FileReader();
    reader.onload = function(event) {
        cleanPrintZone();
        let decoded_file = decode(reader.result);
        let lines = decoded_file.split(/\r\n?/).slice(1);

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            let lineDiv = document.createElement('div');
            lineDiv.className = "qrCodeLine";

            if (i%2 == 1)
                lineDiv.className += " pageBreak";

            let qrCodeDiv = document.createElement('div');
            qrCodeDiv.className = "qrCodeCell";
            textToCode(line, qrCodeDiv);

            let textDiv = document.createElement('div');
            let cells = line.split('\t');
            let names = splitNames(cells[0]);
            textDiv.innerHTML = names[0] + "</br>" + names[1] + "</br>" + cells[1];
            textDiv.className = "qrCodeCell nameCell";

            lineDiv.appendChild(qrCodeDiv);
            lineDiv.appendChild(textDiv);
            content.appendChild(lineDiv);
        }

        drop_zone.remove();
    };
    reader.readAsBinaryString(file);
}

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                processCSVFile(ev.dataTransfer.items[i].getAsFile());
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            processCSVFile(ev.dataTransfer.files[i]);
        }
    }
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

function onDropZoneClick() {
    document.getElementById('file_input').click();
}

function fileUploadHandler(event) {
    for (let i = 0; i < event.target.files.length; i++) {
        processCSVFile(event.target.files[i]);
    }
}