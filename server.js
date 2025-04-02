require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const xml2js = require("xml2js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware to parse raw XML
app.use(bodyParser.text({ type: "application/soap+xml" }));

// // Middleware for API key authentication
// const authenticate = (req, res, next) => {
//   const apiKey = req.headers["x-api-key"];
//   const validApiKey = process.env.API_KEY;

//   if (!apiKey || apiKey !== validApiKey) {
//     return res.status(403).json({ error: "Unauthorized: Invalid API key" });
//   }
//   next();
// };

// Serve WSDL file at both /wsdl and /nameEnquiry
app.get("/wsdl", (req, res) => {
  const wsdlPath = path.join(__dirname, "nameEnquiry.wsdl");
  res.header("Content-Type", "application/xml");
  res.sendFile(wsdlPath);
});

// Add this new route to serve the WSDL when accessed via /nameEnquiry?wsdl
app.get("/nameEnquiry", (req, res) => {
  if (req.query.wsdl !== undefined) {
    // Read the WSDL template
    let wsdlContent = fs.readFileSync(
      path.join(__dirname, "nameEnquiry.wsdl"),
      "utf8"
    );

    // Replace the service location based on environment
    const serviceLocation =
      process.env.NODE_ENV === "production"
        ? "https://getbankdetail.vercel.app/nameEnquiry"
        : "http://localhost:3001/nameEnquiry";

    wsdlContent = wsdlContent.replace(
      /<soap:address location="[^"]*"/,
      `<soap:address location="${serviceLocation}"`
    );

    res.header("Content-Type", "application/xml");
    res.send(wsdlContent);
  } else {
    res.status(404).send("Not Found");
  }
});

const logResponseToFile = (response) => {
  const logFilePath = path.join(__dirname, "response_log.txt");
  const logEntry = `\n[${new Date().toISOString()}] Response:\n${response}\n----------------------------------------\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    } else {
      console.log("Response logged successfully.");
    }
  });
};

// Route to handle the SOAP request
// app.post("/nameEnquiry", authenticate, async (req, res) => {
app.post("/nameEnquiry", async (req, res) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const xmlBuilder = new xml2js.Builder();

    // Parse incoming SOAP XML
    const parsedRequest = await parser.parseStringPromise(req.body);

    // Extract CustomerID from the SOAP request
    const customerID =
      parsedRequest["soap:Envelope"]["soap:Body"]["isw:NameEnquiry"][
        "isw:NameEnquiryRequest"
      ]["isw:CustomerID"];

    // Call the internal REST API
    const response = await axios.get(
      `http://41.204.239.194:8099/WISEBANK/GetCustomerInterswitch?accountNumber=${customerID}`,
      {
        auth: {
          username: process.env.AUTH_USERNAME,
          password: process.env.AUTH_PASSWORD,
        },
        headers: { Accept: "application/json" },
      }
    );

    const customerData = response.data;

    // Construct the SOAP response based on WSDL structure
    const soapResponse = {
      "soap:Envelope": {
        $: {
          "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope",
          "xmlns:isw": "http://techquest.interswitchng.com/nameenquiry/",
        },
        "soap:Body": {
          "isw:NameEnquiryResponse": {
            "isw:ResponseCode": customerData.result ? "00" : "99",
            "isw:CustomerID": customerData.CustomerId,
            "isw:CustomerName": {
              "isw:LastName": customerData.LastName,
              "isw:FirstName": customerData.FirstName.trim(),
              "isw:OtherNames": customerData.OtherNames || "",
            },
            "isw:CustomerAddress": {
              "isw:AddrLine1": customerData.CustomerAddr1,
              "isw:AddrLine2": customerData.CustomerAddr2 || "",
              "isw:City": customerData.StateCode,
              "isw:StateCode": customerData.StateCode,
              "isw:PostalCode": customerData.PostalCode || "",
            },
            "isw:CustomerPhoneNo": customerData.CustomerPhone,
            "isw:AccountType": customerData.AccountType || "N/A",
            "isw:AccountCurrency": customerData.AcctCurrency,
            "isw:CountryCode": customerData.CountryCode,
            "isw:Identification": {
              "isw:IdType": customerData.IDType,
              "isw:IdNumber": customerData.IDNumber,
              "isw:CountryOfIssue": customerData.CountryOfIssue,
              "isw:ExpiryDate": customerData.ExpiryDate || "",
            },
            "isw:Nationality": customerData.Nationality,
            "isw:DOB": customerData.DOB.split("T")[0],
            "isw:CountryOfBirth": customerData.CountryOfBirth,
          },
        },
      },
    };

    // Convert to XML
    const xmlResponse = xmlBuilder.buildObject(soapResponse);

    // Log the response to a text file
    logResponseToFile(xmlResponse);

    // Send SOAP Response
    res.header("Content-Type", "application/soap+xml");
    res.send(xmlResponse);
  } catch (error) {
    console.error("Error processing SOAP request:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`SOAP server is running on port ${port}`);
});
