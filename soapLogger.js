const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

// Ensure the responseLog directory exists
const logDir = path.join(__dirname, "responseLog");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Helper function to get today's log file path
function getLogFilePath() {
  const dateString = format(new Date(), "yyyy-MM-dd");
  return path.join(logDir, `${dateString}.log`);
}

// Helper function to convert response to SOAP format
function formatSoapResponse(responseData) {
  console.log("RESPONSE DATA", responseData);
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:isw="http://techquest.interswitchng.com/nameenquiry/">
  <soapenv:Header/>
  <soapenv:Body>
    <isw:NameEnquiryResponse>
      <ResponseCode>${responseData.ResponseCode ? "00" : "99"}</ResponseCode>
      <ResponseMessage>${
        responseData.ResponseCode === "00" ? "Success" : "failed"
      }</ResponseMessage>
      <CustomerID>${responseData.CustomerID || ""}</CustomerID>
      <CustomerName>
        <LastName>${responseData.CustomerName?.LastName || ""}</LastName>
        <FirstName>${responseData.CustomerName?.FirstName || ""}</FirstName>
        <OtherNames>${responseData.CustomerName?.OtherNames || ""}</OtherNames>
      </CustomerName>
      <CustomerAddress>
        <AddrLine1>${responseData.CustomerAddress?.AddrLine1 || ""}</AddrLine1>
        <AddrLine2>${responseData.CustomerAddress?.AddrLine2 || ""}</AddrLine2>
        <City>${responseData.CustomerAddress?.City || ""}</City>
        <StateCode>${responseData.CustomerAddress?.StateCode || ""}</StateCode>
        <PostalCode>${
          responseData.CustomerAddress?.PostalCode || ""
        }</PostalCode>
      </CustomerAddress>
      <CustomerPhoneNo>${responseData.CustomerPhoneNo || ""}</CustomerPhoneNo>
      <AccountType>${responseData.AccountType || ""}</AccountType>
      <AccountCurrency>${responseData.AccountCurrency || ""}</AccountCurrency>
      <CountryCode>${responseData.CountryCode || ""}</CountryCode>
      <Identification>
        <IdType>${responseData.Identification?.IdType || ""}</IdType>
        <IdNumber>${responseData.Identification?.IdNumber || ""}</IdNumber>
        <CountryOfIssue>${
          responseData.Identification?.CountryOfIssue || ""
        }</CountryOfIssue>
        <ExpiryDate>${
          responseData.Identification?.ExpiryDate || ""
        }</ExpiryDate>
      </Identification>
      <Nationality>${responseData.Nationality || ""}</Nationality>
      <DOB>${responseData.DOB || ""}</DOB>
      <CountryOfBirth>${responseData.CountryOfBirth || ""}</CountryOfBirth>
    </isw:NameEnquiryResponse>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Helper function to log responses
function logSoapResponse(requestData, responseData) {
  const logFilePath = getLogFilePath();
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const soapResponse = formatSoapResponse(responseData);

  const logEntry = `=== ${timestamp} ===
CustomerID: ${requestData.CustomerID || "Unknown"}

RESPONSE:
${soapResponse}

//////////////////////////////////////////////////////////////////////////////////////

`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error("Error writing to log file:", err);
  });
}

module.exports = { logSoapResponse };
