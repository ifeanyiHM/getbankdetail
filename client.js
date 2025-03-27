const axios = require("axios");
require("dotenv").config();
const xml2js = require("xml2js");

const sendSoapRequest = async (customerId) => {
  const soapRequest = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:isw="http://techquest.interswitchng.com/nameenquiry/">
    <soap:Body>
      <isw:NameEnquiry>
        <isw:NameEnquiryRequest>
          <isw:CustomerID>${customerId}</isw:CustomerID>
        </isw:NameEnquiryRequest>
      </isw:NameEnquiry>
    </soap:Body>
  </soap:Envelope>
`;

  try {
    // Send SOAP request to the server
    const response = await axios.post(
      "http://localhost:3000/nameEnquiry",
      soapRequest,
      {
        headers: {
          "Content-Type": "application/soap+xml",
          "x-api-key": process.env.API_KEY,
        },
      }
    );

    // Raw SOAP Response
    console.log("===== RAW SOAP RESPONSE =====");
    console.log(response.data);
    console.log("=============================");

    // Parse XML response
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedResponse = await parser.parseStringPromise(response.data);

    // Extract data from the response
    const result =
      parsedResponse["soap:Envelope"]["soap:Body"]["isw:NameEnquiryResponse"][
        "isw:NameEnquiryResponseResult"
      ];

    console.log("===== SOAP Response =====");
    console.log(`Response Code: ${result["isw:ResponseCode"]}`);
    console.log(`Customer ID: ${result["isw:CustomerID"]}`);
    console.log(
      `Name: ${result["isw:CustomerName"]["isw:FirstName"]} ${result["isw:CustomerName"]["isw:LastName"]}`
    );
    console.log(`Phone: ${result["isw:CustomerPhoneNo"]}`);
    console.log(
      `Address: ${result["isw:CustomerAddress"]["isw:AddrLine1"]}, ${result["isw:CustomerAddress"]["isw:AddrLine2"]}`
    );
    console.log(`Account Type: ${result["isw:AccountType"]}`);
    console.log(`Currency: ${result["isw:AccountCurrency"]}`);
    console.log("=========================");
  } catch (error) {
    console.error("Error making SOAP request:", error.message);
  }
};

const customerId = process.argv[2] || "1000018118";

// Call the function
sendSoapRequest(customerId);
