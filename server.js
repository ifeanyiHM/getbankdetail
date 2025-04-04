require("dotenv").config();
const soap = require("soap");
const axios = require("axios");
const http = require("http");
const { logSoapResponse } = require("./soapLogger");

// Modify your NameEnquiry function
const service = {
  NameEnquiryService: {
    NameEnquiryPort: {
      NameEnquiry: async function (args, callback) {
        try {
          const customerID = args.CustomerID;
          console.log("CustomerID", customerID);

          if (!customerID) {
            throw new Error("Missing CustomerID in request");
          }

          const response = await axios.get(
            `http://41.204.239.194:8099/WISEBANK/GetCustomerInterswitch?accountNumber=${customerID}`,
            {
              auth: {
                username: process.env.AUTH_USERNAME,
                password: process.env.AUTH_PASSWORD,
              },
              headers: { Accept: "application/json" },
              timeout: 20000,
            }
          );

          const customerData = response.data;

          if (!customerData.result) {
            throw new Error("Could not fetch Data");
          }

          const result = {
            ResponseCode: customerData.result ? "00" : "99",
            CustomerID: customerData.CustomerId,
            CustomerName: {
              LastName: customerData.LastName,
              FirstName: customerData.FirstName.trim(),
              OtherNames: customerData.OtherNames || "",
            },
            CustomerAddress: {
              AddrLine1: customerData.CustomerAddr1,
              AddrLine2: customerData.CustomerAddr2 || "",
              City: customerData.StateCode,
              StateCode: customerData.StateCode,
              PostalCode: customerData.PostalCode || "",
            },
            CustomerPhoneNo: customerData.CustomerPhone,
            AccountType: customerData.AccountType || "N/A",
            AccountCurrency: customerData.AcctCurrency,
            CountryCode: customerData.CountryCode,
            Identification: {
              IdType: customerData.IDType,
              IdNumber: customerData.IDNumber,
              CountryOfIssue: customerData.CountryOfIssue,
              ExpiryDate: customerData.ExpiryDate || "",
            },
            Nationality: customerData.Nationality,
            DOB: customerData.DOB.split("T")[0],
            CountryOfBirth: customerData.CountryOfBirth,
          };

          // Log successful response
          logSoapResponse({ CustomerID: customerID }, result);
          callback(null, result);
        } catch (error) {
          console.error("SOAP Error:", error.message);
          const errorResponse = {
            ResponseCode: "99",
            ResponseMessage: error.message,
            ErrorDetails: {
              Timestamp: new Date().toISOString(),
              CustomerID: args.CustomerID || "Unknown",
              Service: "NameEnquiry",
            },
          };

          // Log error response
          logSoapResponse(
            { CustomerID: args.CustomerID || "Unknown" },
            errorResponse
          );
          callback(null, errorResponse);
        }
      },
    },
  },
};

// Create the SOAP server
const xml = require("fs").readFileSync("nameEnquiry.wsdl", "utf8");
const port = process.env.PORT || 3001;
var server = http.createServer(function (request, response) {
  response.end("404: Not Found:" + request.url);
});
server.listen(port);
soap.listen(server, "/nameEnquiry", service, xml, function () {
  console.log("SOAP server running at http://localhost:3001//nameEnquiry?wsdl");
});
// Attach the service implementation to the SOAP server
// server.addService(xml, service, { suppressStack: true });

///////////////////////////////////////////////////////////////////////////////////////////////

// // Attach the service implementation to the SOAP server
// server.addService(xml, service, { suppressStack: true });

// // // Read the WSDL file
// // const wsdlPath = path.join(__dirname, "nameEnquiry.wsdl");
// // const wsdl = fs.readFileSync(wsdlPath, "utf8");

// // Create HTTP server
// const port = process.env.PORT || 3001;
// const server = http.createServer(function (request, response) {
//   // Handle WSDL requests
//   if (request.url === "/nameEnquiry?wsdl" && request.method === "GET") {
//     response.writeHead(200, { "Content-Type": "application/xml" });
//     response.end(wsdl);
//     return;
//   }

//   // All other requests
//   response.end("404: Not Found");
// });

// // Start the server
// server.listen(port, function () {
//   console.log(`Server listening on port ${port}`);

//   // Create SOAP server after HTTP server is ready
//   soap.listen(server, "/nameEnquiry", service, wsdl, function () {
//     console.log(`SOAP service available at /nameEnquiry`);
//   });
// });

// // Log responses
// server.on("request", function (request, response) {
//   if (request.url === "/nameEnquiry" && request.method === "POST") {
//     let body = "";
//     request.on("data", function (chunk) {
//       body += chunk;
//     });
//     request.on("end", function () {
//       const logFilePath = path.join(__dirname, "response_log.txt");
//       const logEntry = `\n[${new Date().toISOString()}] Request:\n${body}\n----------------------------------------\n`;

//       fs.appendFile(logFilePath, logEntry, (err) => {
//         if (err) console.error("Error writing to log file:", err);
//       });
//     });
//   }
// });

// require("dotenv").config();
// const express = require("express");
// const morgan = require("morgan");
// const bodyParser = require("body-parser");
// const xml2js = require("xml2js");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// const app = express();

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }
// const xmlBuilder = new xml2js.Builder();
// // Middleware to parse raw XML
// // app.use(bodyParser.text({ type: "application/soap+xml" }));
// app.use(
//   bodyParser.raw({
//     type: ["application/soap+xml", "text/xml"],
//     limit: "5mb",
//   })
// );

// // // Middleware for API key authentication
// // const authenticate = (req, res, next) => {
// //   const apiKey = req.headers["x-api-key"];
// //   const validApiKey = process.env.API_KEY;

// //   if (!apiKey || apiKey !== validApiKey) {
// //     return res.status(403).json({ error: "Unauthorized: Invalid API key" });
// //   }
// //   next();
// // };

// // Serve WSDL file at both /wsdl and /nameEnquiry
// app.get("/wsdl", (req, res) => {
//   const wsdlPath = path.join(__dirname, "nameEnquiry.wsdl");
//   res.header("Content-Type", "application/xml");
//   res.sendFile(wsdlPath);
// });

// // Add this new route to serve the WSDL when accessed via /nameEnquiry?wsdl
// app.get("/nameEnquiry", (req, res) => {
//   if (req.query.wsdl !== undefined) {
//     // Read the WSDL template
//     let wsdlContent = fs.readFileSync(
//       path.join(__dirname, "nameEnquiry.wsdl"),
//       "utf8"
//     );

//     // Replace the service location based on environment
//     const serviceLocation =
//       process.env.NODE_ENV === "production"
//         ? "https://getbankdetail.vercel.app/nameEnquiry"
//         : "http://localhost:3001/nameEnquiry";

//     wsdlContent = wsdlContent.replace(
//       /<soap:address location="[^"]*"/,
//       `<soap:address location="${serviceLocation}"`
//     );

//     res.header("Content-Type", "application/xml");
//     res.send(wsdlContent);
//   } else {
//     res.status(404).send("Not Found");
//   }
// });

// const logResponseToFile = (response) => {
//   const logFilePath = path.join(__dirname, "response_log.txt");
//   const logEntry = `\n[${new Date().toISOString()}] Response:\n${response}\n----------------------------------------\n`;

//   fs.appendFile(logFilePath, logEntry, (err) => {
//     if (err) {
//       console.error("Error writing to log file:", err);
//     } else {
//       console.log("Response logged successfully.");
//     }
//   });
// };

// // Route to handle the SOAP request
// // app.post("/nameEnquiry", authenticate, async (req, res) => {
// app.post("/nameEnquiry", async (req, res) => {
//   try {
//     // Ensure we have a buffer
//     if (!req.body || req.body.length === 0) {
//       throw new Error("Empty SOAP request received");
//     }

//     // Convert buffer to string
//     const xmlString = req.body.toString("utf8").trim();
//     console.log("Raw XML request:", xmlString);

//     // Validate basic XML structure
//     if (!xmlString.startsWith("<") || !xmlString.includes("Envelope")) {
//       throw new Error("Invalid SOAP XML format");
//     }

//     // Parse XML
//     const parser = new xml2js.Parser({
//       explicitArray: false,
//       trim: true,
//       normalize: true,
//     });

//     const parsedRequest = await parser.parseStringPromise(xmlString);
//     console.log(parsedRequest);

//     // Extract CustomerID (updated path based on your WSDL)
//     const customerID =
//       parsedRequest["soap:Envelope"]?.["soap:Body"]?.[
//         "isw:NameEnquiryRequest"
//       ]?.["isw:CustomerID"];

//     if (!customerID) {
//       throw new Error("Missing CustomerID in request");
//     }

//     // Call the internal REST API
//     const response = await axios.get(
//       `http://41.204.239.194:8099/WISEBANK/GetCustomerInterswitch?accountNumber=${customerID}`,
//       {
//         auth: {
//           username: process.env.AUTH_USERNAME,
//           password: process.env.AUTH_PASSWORD,
//         },
//         headers: { Accept: "application/json" },
//       }
//     );

//     const customerData = response.data;

//     // Construct the SOAP response based on WSDL structure
//     const soapResponse = {
//       "soap:Envelope": {
//         $: {
//           "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope",
//           "xmlns:isw": "http://techquest.interswitchng.com/nameenquiry/",
//         },
//         "soap:Body": {
//           "isw:NameEnquiryResponse": {
//             "isw:ResponseCode": customerData.result ? "00" : "99",
//             "isw:CustomerID": customerData.CustomerId,
//             "isw:CustomerName": {
//               "isw:LastName": customerData.LastName,
//               "isw:FirstName": customerData.FirstName.trim(),
//               "isw:OtherNames": customerData.OtherNames || "",
//             },
//             "isw:CustomerAddress": {
//               "isw:AddrLine1": customerData.CustomerAddr1,
//               "isw:AddrLine2": customerData.CustomerAddr2 || "",
//               "isw:City": customerData.StateCode,
//               "isw:StateCode": customerData.StateCode,
//               "isw:PostalCode": customerData.PostalCode || "",
//             },
//             "isw:CustomerPhoneNo": customerData.CustomerPhone,
//             "isw:AccountType": customerData.AccountType || "N/A",
//             "isw:AccountCurrency": customerData.AcctCurrency,
//             "isw:CountryCode": customerData.CountryCode,
//             "isw:Identification": {
//               "isw:IdType": customerData.IDType,
//               "isw:IdNumber": customerData.IDNumber,
//               "isw:CountryOfIssue": customerData.CountryOfIssue,
//               "isw:ExpiryDate": customerData.ExpiryDate || "",
//             },
//             "isw:Nationality": customerData.Nationality,
//             "isw:DOB": customerData.DOB.split("T")[0],
//             "isw:CountryOfBirth": customerData.CountryOfBirth,
//           },
//         },
//       },
//     };

//     // Convert to XML
//     const xmlResponse = xmlBuilder.buildObject(soapResponse);

//     // Log the response to a text file
//     logResponseToFile(xmlResponse);

//     // Send SOAP Response
//     res.header("Content-Type", "application/soap+xml");
//     res.send(xmlResponse);
//   } catch (error) {
//     console.error("SOAP Error:", error.message);

//     // Build proper SOAP fault
//     const fault = {
//       "soap:Envelope": {
//         $: {
//           "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope",
//         },
//         "soap:Body": {
//           "soap:Fault": {
//             faultcode: "soap:Client",
//             faultstring: error.message,
//           },
//         },
//       },
//     };

//     res
//       .status(500)
//       .header("Content-Type", "application/soap+xml")
//       .send(xmlBuilder.buildObject(fault));
//   }
// });

// const port = process.env.PORT || 3001;
// app.listen(port, () => {
//   console.log(`SOAP server is running on port ${port}`);
// });
