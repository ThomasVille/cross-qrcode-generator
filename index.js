let last_decoded_file;
let last_file;
let last_generated_pdf;
let columns;
let cells;

function resetUIAndVariables() {
    document.getElementById("lastname-select").innerHTML = '';
    document.getElementById("firstname-select").innerHTML = '';
    document.getElementById("class-select").innerHTML = '';
    document.getElementById("gender-select").innerHTML = '';
    document.getElementById("birthdate-select").innerHTML = '';

    columns = {
        "firstname": 0,
        "lastname": 0,
        "class": 0,
        "birthdate": 0,
        "gender": 0,
    };

    cells = undefined;
}

function textToCode(text) {
    let htmlElement = document.createElement('div');
    let qrcode = new QRCode(htmlElement, {
        width : 200,
        height : 200
    });

    qrcode.makeCode(text);

    return htmlElement.getElementsByTagName("canvas")[0];
}

function textToPDF(lines) {
    const doc = new jspdf.jsPDF({
        unit: "mm",
        format: 'a4'
    });
    const HALF_HEIGHT = 297/2;
    const QUARTER_HEIGHT = 297/4;
    const HALF_WIDTH = 210/2;

    for (let i = 0; i < lines.length; i++) {
        let class_str = lines[i][columns.class];
        let firstname = lines[i][columns.firstname];
        let lastname = lines[i][columns.lastname];
        let birthdate = lines[i][columns.birthdate];
        let gender = lines[i][columns.gender];

        doc.setFontSize(30);
        let splitLastName = doc.splitTextToSize(lastname, 210 - (HALF_WIDTH + 20) - 10);

        doc.text(splitLastName, HALF_WIDTH + 20, QUARTER_HEIGHT - 15 - (splitLastName.length > 1 ? 11 : 0) + HALF_HEIGHT * (i%2));
        doc.text(firstname, HALF_WIDTH + 20, QUARTER_HEIGHT + HALF_HEIGHT * (i%2));
        doc.text(class_str, HALF_WIDTH + 20, QUARTER_HEIGHT + 15 + HALF_HEIGHT * (i%2));

        let qr_code_canvas = textToCode(`${lastname} ${firstname};${class_str};${birthdate};${gender}`);

        doc.addImage(qr_code_canvas, 'JPEG', 20, QUARTER_HEIGHT - 35 + HALF_HEIGHT * (i%2), 70, 70, '', 'MEDIUM', 0);

        if (i%2 == 1 && i < lines.length - 1)
            doc.addPage('a4', 'portrait');
    }
    last_generated_pdf = doc;
}

function setSampleData(firstname, lastname, class_str, birthdate, gender) {
    document.getElementById("sample_firstname").innerText = firstname;
    document.getElementById("sample_lastname").innerText = lastname;
    document.getElementById("sample_class").innerText = class_str;
    document.getElementById("sample_birthdate").innerText = birthdate;
    document.getElementById("sample_gender").innerText = gender;
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
    if (!file) {
        return;
    }

    console.log(file);
    last_file = file;
    let drop_zone_text = document.getElementById("drop_zone_text");
    let save_pdf_button = document.getElementById("save_pdf_button");
    let encoding_select = document.getElementById("encoding-select");

    drop_zone_text.innerText = "Génération des dossards en cours...";

    let reader = new FileReader();
    reader.onload = function(event) {
        decoded_file = reader.result;

        if (decoded_file.indexOf('�') != -1) {
            console.log('Invalid characters found, trying to decode macintosh encoding');
            let reader = new FileReader();
            reader.onload = function(event) {
                let decoded_file = decode(reader.result, {
                    mode: 'fatal'
                });
                last_decoded_file = decoded_file;
                processCSVFile(decoded_file);
                drop_zone_text.innerText = "Importer une nouvelle liste";
                save_pdf_button.removeAttribute("disabled");
            };
            reader.readAsBinaryString(file);
        } else {
            console.log('No invalid characters found, continuing with ' + encoding_select.value);
            last_decoded_file = decoded_file;
            processCSVFile(decoded_file);
            drop_zone_text.innerText = "Importer une nouvelle liste";
            save_pdf_button.removeAttribute("disabled");
        }
    };

    reader.readAsText(file, encoding_select.value);
}

function detectSeparator(str) {
    let max_occurrences = 0;
    let separators = ['\t', ',', ';'];
    let best_separator = separators[0];

    for (let separator of separators) {
        let occurences =  str.split(separator).length - 1;

        if (occurences > max_occurrences) {
            max_occurrences = occurences;
            best_separator = separator;
        }
    }

    return best_separator;
}

function generateDefaultColumnSelector(first_line, has_header) {
    let options;

    if (has_header) {
        // Build the options directly from the header.
        options = first_line.map(h => `<option value="${h}">${h}</option>`).join();
    } else {
        // Generate the options from the number of columns.
        let fake_header = Array(first_line.length).fill(0).map((x, i) => `Colonne ${i+1}`);
        options = fake_header.map(h => `<option value="${h}">${h}</option>`).join();
    }

    document.getElementById("lastname-select").innerHTML = options;
    document.getElementById("firstname-select").innerHTML = options;
    document.getElementById("class-select").innerHTML = options;
    document.getElementById("gender-select").innerHTML = options;
    document.getElementById("birthdate-select").innerHTML = options;
}

function processCSVFile(decoded_file) {
    if (!decoded_file) {
        return;
    }
    let has_header = document.getElementById("has_header").checked;
    let first_line = undefined;

    let separator = detectSeparator(decoded_file);
    let lines = decoded_file.split(/\r\n?/);

    cells = lines.filter(l => l.length).map(l => l.replaceAll("\"", "").split(separator));
    first_line = cells[0];

    if (has_header) {
        cells = cells.slice(1);
    }

    if (!document.getElementById("lastname-select").childElementCount) {
        generateDefaultColumnSelector(first_line, has_header);
    }
    if (cells.length > 0) {
        setSampleData(cells[0][columns.firstname], cells[0][columns.lastname], cells[0][columns.class], cells[0][columns.birthdate], cells[0][columns.gender]);
    }
}

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    resetUIAndVariables();

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
    resetUIAndVariables();
    for (let i = 0; i < event.target.files.length; i++) {
        readCSVFile(event.target.files[i]);
    }
}

function hasHeaderChanged() {
    resetUIAndVariables();
    processCSVFile(last_decoded_file);
}

function hasSelectChanged(column_id, column_index) {
    columns[column_id] = column_index;
    processCSVFile(last_decoded_file);
}

function hasEncodingSelectChanged() {
    readCSVFile(last_file);
}

function savePDF() {
    if (cells) {
        textToPDF(cells);
        last_generated_pdf.save("Dossards.pdf");
    }
}