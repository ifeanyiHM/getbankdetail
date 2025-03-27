require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const xml2js = require("xml2js");
const axios = require("axios");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware to parse raw XML
app.use(bodyParser.text({ type: "application/soap+xml" }));

// Middleware for API key authentication
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(403).json({ error: "Unauthorized: Invalid API key" });
  }

  next();
};

// Route to handle the SOAP request
app.post("/nameEnquiry", authenticate, async (req, res) => {
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

    // Construct the SOAP response
    const soapResponse = {
      "soap:Envelope": {
        $: {
          "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope",
          "xmlns:isw": "http://techquest.interswitchng.com/nameenquiry/",
        },
        "soap:Body": {
          "isw:NameEnquiryResponse": {
            "isw:NameEnquiryResponseResult": {
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
      },
    };

    // Convert to XML
    const xmlResponse = xmlBuilder.buildObject(soapResponse);

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
