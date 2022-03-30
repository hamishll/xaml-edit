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
let tagToMutate2 = document.getElementById("Tag2").value;
let parameterToMutate = document.getElementById("Parameter").value;
let parameterValueInit = document.getElementById("ParameterValueInit").value;
let version = "";

// Add event listener for input parameters
let allInputDOMElements = document.querySelectorAll(".dimension_box");
allInputDOMElements.forEach((item) =>
  item.addEventListener("keyup", getInputParameters)
);

// Update input parameters on event
function getInputParameters() {
  tagToMutate = document.getElementById("Tag").value;
  tagToMutate2 = document.getElementById("Tag2").value;
  parameterToMutate = document.getElementById("Parameter").value;
  parameterValueInit = document.getElementById("ParameterValueInit").value;
}

let zip = new JSZip();
let zipArray = [];
let fname = "Initial Filename Value";
let fnameArray = [];
//zip.file("README.md", "Test\n");

//////////////////////////////////////////////////////////////////
// 1. Process files after file chosen
//////////////////////////////////////////////////////////////////

input.onchange = function () {
  // Loop through each file uploaded
  for (let i = 0; i < this.files.length; i++) {
    fname = this.files[i].name;
    zip.loadAsync(this.files[i] /* = file blob */).then(
      (zip) => {
        //mutateSingleNupkgFile(zip).then((zip) => exportAll(zip, fname));
        // setTimeout(() => {
        mutateSingleNupkgFile(zip, fname).then(
          (zip) => {
            //alert(zip);
            //exportAll(zip, fname);
          }
          // addZipToArray(zip, fname)
        );
        // }, 1000);
      },
      function () {
        alert("Not a valid .nupkg file");
      }
    );
  }
};

async function mutateSingleNupkgFile(zip, fname) {
  // process ZIP file content here
  zip = await mutateAllXamlFiles(zip);
  // addZipToArray(zip, fname);
  //alert("mutateSingleNupkgFile returning", zip);
  return zip;
}

async function mutateAllXamlFiles(zip) {
  console.log("--------------------- " + fname + " ----------------------");
  console.log(zip);

  // This loop isn't awaiting all promises before returning
  for await (const [index, file] of Object.entries(zip.files)) {
    zip = await mutateSingleXamlFile(index, file);
  }

  // zip.forEach(async (relativePath, file) => {
  //   mutateSingleXamlFile(relativePath, file);
  // });
  //alert("mutateAllXamlFiles returning", zip);
  return zip;
}

async function mutateSingleXamlFile(relativePath, file) {
  //console.log(relativePath, file);
  // If a XAML file is found, we'll search it for the desired tag
  // console.log(file, file.files);
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
          // Set the new attributes
          xmlDoc
            .getElementsByTagName(tagToMutate)
            [i].setAttribute(parameterToMutate, parameterValueInit);

          // Log the tag that has been mutated
          console.log(xmlDoc.getElementsByTagName(tagToMutate)[i]);
          logOutput(
            XMLS.serializeToString(xmlDoc.getElementsByTagName(tagToMutate)[i])
          );
        }
        // For every instance of the desired tag 2, we'll edit the attribute
        for (
          let i = 0;
          i < xmlDoc.getElementsByTagName(tagToMutate2).length;
          i++
        ) {
          // Set the new attributes
          xmlDoc
            .getElementsByTagName(tagToMutate2)
            [i].setAttribute(parameterToMutate, parameterValueInit);

          // Log the tag that has been mutated
          console.log(xmlDoc.getElementsByTagName(tagToMutate2)[i]);
          logOutput(
            XMLS.serializeToString(xmlDoc.getElementsByTagName(tagToMutate2)[i])
          );
        }
        // Then parse as a string
        fileString = XMLS.serializeToString(xmlDoc);

        // Update the file in the ZIP with the edited data
        zip.file(file.name, fileString);

        //console.log("async issue?");
        //alert("mutateSingleXamlFile returning", zip);
      });
  } else if (right(file.name, 11) == "roject.json") {
    zip
      .file(file.name)
      .async("string")
      .then((fileString) => {
        let fileAsJSON = JSON.parse(fileString);
        // eg: "1.0.23"
        version = "" + fileAsJSON.projectVersion;
        fileAsJSON.projectVersion = incrementVersion(version);
        fileString = JSON.stringify(fileAsJSON);
        //console.log(fileString);
        zip.file(file.name, fileString);
      });
  } else if (right(file.name, 7) == ".nuspec") {
    // Get the value of each XAML file with a promise
    zip
      .file(file.name)
      .async("string")
      .then((fileString) => {
        // Parse string as XML
        //parser = new DOMParser();
        //xmlDoc = parser.parseFromString(fileString, "text/xml");

        // Log the name of the XAML file found
        console.log("--- .NUSPEC FILE FOUND ---", file.name);
        logOutput("--- .NUSPEC FILE FOUND ---" + file.name);
        console.log(fileString);
        let startPos = fileString.search("<version>") + 9;
        let endPos = fileString.search("</version>");
        let versionOriginal = "" + fileString.slice(startPos, endPos);
        version = incrementVersion(versionOriginal);
        console.log("Version", version);
        fileString =
          fileString.slice(0, startPos) +
          version +
          fileString.slice(endPos, fileString.length);
        console.log("New .nuspec", fileString);

        //let XMLS = new XMLSerializer();

        // // For every instance of the desired tag, we'll edit the attribute
        // for (
        //   let i = 0;
        //   i < xmlDoc.getElementsByTagName("version").length;
        //   i++
        // ) {
        // Set the new attributes

        // xmlDoc.getElementsByTagName("version")[i].childNodes[0].nodeValue =
        //   version;
        // // Log the tag that has been mutated
        // console.log(xmlDoc.getElementsByTagName("version")[i]);
        // logOutput(
        //   XMLS.serializeToString(xmlDoc.getElementsByTagName("version")[i])
        // );
        //}

        // Then parse as a string
        // fileString = XMLS.serializeToString(xmlDoc);

        // Update the file in the ZIP with the edited data
        zip.file(file.name, fileString);

        //console.log("async issue?");
        //alert("mutateSingleXamlFile returning", zip);
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

function addZipToArray(zip, fname) {
  zipArray.push(zip);
  fnameArray.push(fname);
  console.log("Added zip to array", zipArray, fnameArray);
}

// async function exportAll(zipArray, fnameArray) {
//   for (let i = 0; i < zip.Array.length; i++) {
//     zipArray[i].generateAsync({ type: "blob" }).then(function (content) {
//       // see FileSaver.js
//       saveAs(content, fnameArray[i]);
//     });
//   }
// }
async function exportAll(zip, fname) {
  zip.generateAsync({ type: "blob" }).then(function (content) {
    // see FileSaver.js
    saveAs(content, fname);
    //alert("First zip exported");
  });
}

//////////////////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////////////////

// Right function
function right(str, chr) {
  return str.slice(str.length - chr, str.length);
}

function incrementVersion(version) {
  // eg: "1.0.23"
  regex1 = /^\d+\./g;
  version = parseInt(version.match(regex1)[0].replace(".", "")) + 1 + ".001";

  return version;
}
// console.log("1.01.23 =>", incrementVersion("1.01.23"));
// console.log("1.1.2 =>", incrementVersion("1.1.2"));
// console.log("1.04.20 =>", incrementVersion("1.01.20"));
// console.log("1.001.20 =>", incrementVersion("1.001.20"));
