# Name Enquiry API - Postman Testing Guide

## 📌 Overview

This document provides step-by-step instructions on how to test the **Name Enquiry API** using **Postman**.

## 🚀 API Endpoint

**URL:**

```
https://getbankdetail.vercel.app/nameEnquiry
```

**Method:** `POST`  
**Content-Type:** `application/soap+xml`  
**Authentication:** API Key (`x-api-key`)

---

## 🔹 1. Setting Up the Request in Postman

### **Step 1: Open Postman**

If you haven't installed Postman, download it from [here](https://www.postman.com/downloads/).

### **Step 2: Create a New Request**

1. Click **New Request**
2. Set the request **method** to `POST`
3. Enter the request URL:
   ```
   https://getbankdetail.vercel.app/nameEnquiry
   ```

---

## 🔹 2. Add Headers

| Header Key     | Header Value           |
| -------------- | ---------------------- |
| `Content-Type` | `application/soap+xml` |
| `x-api-key`    | `**********`           |

1. Go to the **Headers** tab.
2. Add the headers as shown in the table above.

---

## 🔹 3. Add the Request Body

1. Go to the **Body** tab.
2. Select **raw** as the input type.
3. Paste the following XML request:

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:isw="http://techquest.interswitchng.com/nameenquiry/">
  <soap:Body>
    <isw:NameEnquiry>
      <isw:NameEnquiryRequest>
        <isw:CustomerID>1000018118</isw:CustomerID>
      </isw:NameEnquiryRequest>
    </isw:NameEnquiry>
  </soap:Body>
</soap:Envelope>
```

---

## 🔹 4. Send the Request

- Click on the **Send** button to execute the request.
- Postman will process the request and return a response.

---

## 🔹 5. Expected Response

A successful response should return an XML body like this:

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <isw:NameEnquiryResponse>
      <isw:NameEnquiryResponseResult>
        <isw:ResponseCode>00</isw:ResponseCode>
        <isw:CustomerID>1000018118</isw:CustomerID>
        <isw:CustomerName>
          <isw:LastName>NASHON</isw:LastName>
          <isw:FirstName>CAROLINE</isw:FirstName>
        </isw:CustomerName>
      </isw:NameEnquiryResponseResult>
    </isw:NameEnquiryResponse>
  </soap:Body>
</soap:Envelope>
```

---

## 🔹 6. Troubleshooting

- **401 Unauthorized:** Check if the API key (`x-api-key`) is correct.
- **415 Unsupported Media Type:** Ensure the `Content-Type` header is set correctly.
- **500 Internal Server Error:** Verify that the XML body structure is valid.

---

## 🎯 Conclusion

This guide ensures that **anyone** can test the Name Enquiry API using Postman. If you encounter issues, double-check the headers, request body, and endpoint URL.
