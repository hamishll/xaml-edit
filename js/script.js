//////////////////////////////////////////////////////////////////
// 0. Initialise Application
//////////////////////////////////////////////////////////////////
let input = document.getElementById("input");
//input.addEventListener('change', handleFiles);

// Handle logging to DOM
let logDOMElement = document.getElementById("logOutput");
function logOutput(message) {
  const node = document.createElement("p");
  const textnode = document.createTextNode(message);
  node.appendChild(textnode);
  logDOMElement.appendChild(node);
}

// Instantiate input parameters
let tagToMutate = document.getElementById("Tag").value;
let parameterToMutate = document.getElementById("Parameter").value;
//let parameterValue = document.getElementById("ParameterValue").value;
let parameterValueInit = document.getElementById("ParameterValueInit").value;

// Add event listener for input parameters
let allInputDOMElements = document.querySelectorAll(".dimension_box");
allInputDOMElements.forEach((item) =>
  item.addEventListener("keyup", getInputParameters)
);

// Update input parameters on event
function getInputParameters() {
  tagToMutate = document.getElementById("Tag").value;
  parameterToMutate = document.getElementById("Parameter").value;
  //parameterValue = document.getElementById("ParameterValue").value;
  parameterValueInit = document.getElementById("ParameterValueInit").value;
  //console.log(tagToMutate,parameterToMutate,parameterValue);
}

let zip = new JSZip();
let fname = "Test";
//zip.file("README.md", "Test\n");

//////////////////////////////////////////////////////////////////
// 1. Load files after file chosen
//////////////////////////////////////////////////////////////////

input.onchange = function () {
  // Loop through each file uploaded
  for (let i = 0; i < this.files.length; i++) {
    fname = this.files[i].name;

    zip.loadAsync(this.files[i] /* = file blob */).then(
      async function (zip) {
        // process ZIP file content here
        getAllXamlFiles(zip, fname).then((zip) => {
          exportAll(zip, fname);
        });
        //exportAll(zip, fname);
      },
      function () {
        //alert("Not a valid zip file");
      }
    );
  }
};

async function getAllXamlFiles(zip, fname) {
  //console.log("--------------------- " + fname + " ----------------------");
  zip.forEach((relativePath, file) => {
    parseXamlChanges(relativePath, file);
  });
  return zip;
}

async function parseXamlChanges(relativePath, file) {
  // If a XAML file is found, we'll search it for the desired tag
  if (right(file.name, 4) == "xaml") {
    // Get the value of each XAML file with a promise
    zip
      .file(file.name)
      .async("string")
      .then((fileString) => {
        // Parse string as XML
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(fileString, "text/xml");

        // Log the name of the XAML file found
        console.log("--- XAML FILE FOUND ---", file.name);
        logOutput("--- XAML FILE FOUND ---" + file.name);

        let XMLS = new XMLSerializer();

        // For every instance of the desired tag, we'll edit the attribute
        for (
          let i = 0;
          i < xmlDoc.getElementsByTagName(tagToMutate).length;
          i++
        ) {
          // Set the new attribute
          xmlDoc
            .getElementsByTagName(tagToMutate)
            [i].setAttribute(parameterToMutate, parameterValueInit);

          // Log the tag that has been mutated
          console.log(xmlDoc.getElementsByTagName(tagToMutate)[i]);
          logOutput(
            XMLS.serializeToString(xmlDoc.getElementsByTagName(tagToMutate)[i])
          );
        }
        // Then parse as a string
        fileString = XMLS.serializeToString(xmlDoc);

        // Update the file in the ZIP with the edited data
        zip.file(file.name, "fileString");

        //console.log("async issue?");
      });
  } else {
    // Do nothing
  }
  return zip;
}
//////////////////////////////////////////////////////////////////
// 3. Export file
//////////////////////////////////////////////////////////////////
function pressExport() {
  exportAll(zip, fname);
}
function exportAll(zip, fname) {
  zip.generateAsync({ type: "blob" }).then(function (content) {
    // see FileSaver.js
    saveAs(content, fname); //Remove the .zip later
  });
}

//////////////////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////////////////

// Right function
function right(str, chr) {
  return str.slice(str.length - chr, str.length);
}
