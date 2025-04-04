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
const port = process.env.PORT || 3000;
var server = http.createServer(function (request, response) {
  response.end("404: Not Found:" + request.url);
});
server.listen(port);
soap.listen(server, "/nameEnquiry", service, xml, function () {
  console.log("SOAP server running at http://localhost:3000/nameEnquiry?wsdl");
});
