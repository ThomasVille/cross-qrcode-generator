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

function readCSVFile(file) {
    console.log(file);
    let drop_zone_text = document.getElementById("drop_zone_text");
    drop_zone_text.innerText = "Génération des dossards en cours...";

    let reader = new FileReader();
    reader.onload = function(event) {
        cleanPrintZone();

        decoded_file = reader.result;

        if (decoded_file.indexOf('�') != -1) {
            let reader = new FileReader();
            reader.onload = function(event) {
                let decoded_file = decode(reader.result, {
                    mode: 'fatal'
                  });
                processCSVFile(decoded_file);
            };
            reader.readAsBinaryString(file);
        } else {
            processCSVFile(decoded_file);
        }

    };
    reader.readAsText(file);
}

function processCSVFile(decoded_file) {
    let content = document.getElementById('print_zone');
    let drop_zone = document.getElementById("drop_zone");

    let lines = decoded_file.split(/\r\n?/).slice(1);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.length == 0)
            continue;

        if (line[0] == "\"") {
            line = line.replaceAll("\"", "");
            var cells = line.split(';');
        } else if (line.indexOf(";") != -1) {
            var cells = line.split(';');
        } else {
            var cells = line.split('\t');
        }

        let lineDiv = document.createElement('div');
        lineDiv.className = "qrCodeLine";

        if (i%2 == 1)
            lineDiv.className += " pageBreak";

        let qrCodeDiv = document.createElement('div');
        qrCodeDiv.className = "qrCodeCell";
        textToCode(cells.join(';'), qrCodeDiv);

        let textDiv = document.createElement('div');

        let names = splitNames(cells[0]);
        textDiv.innerHTML = names[0] + "</br>" + names[1] + "</br>" + cells[1];
        textDiv.className = "qrCodeCell nameCell";

        lineDiv.appendChild(qrCodeDiv);
        lineDiv.appendChild(textDiv);
        content.appendChild(lineDiv);
    }

    drop_zone.remove();
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
                readCSVFile(ev.dataTransfer.items[i].getAsFile());
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            readCSVFile(ev.dataTransfer.files[i]);
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
        readCSVFile(event.target.files[i]);
    }
}