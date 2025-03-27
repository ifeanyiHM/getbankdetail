const express = require("express");

const app = express();
const port = 4000;

// Sample customer database
const customers = {
  1913446553: {
    firstName: "John",
    lastName: "Doe",
    otherNames: "Michael",
    address: {
      line1: "123 Main Street",
      line2: "Apartment 4B",
      city: "Lagos",
      state: "Lagos",
      postalCode: "100001",
    },
    phoneNumber: "2348012345678",
    accountType: "10", // Savings
    accountCurrency: "566", // Naira
    countryCode: "NG",
    identification: {
      type: "BVN",
      number: "22196110338",
      countryOfIssue: "Nigeria",
      expiryDate: "",
    },
    nationality: "Nigerian",
    dob: "01/01/1985",
    countryOfBirth: "Nigeria",
  },
};

// Endpoint to fetch customer data
app.get("/getCustomer/:customerID", (req, res) => {
  const customerID = req.params.customerID;
  const customer = customers[customerID];

  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

// Start the internal API server
app.listen(port, () => {
  console.log(`Internal API is running on port ${port}`);
});
