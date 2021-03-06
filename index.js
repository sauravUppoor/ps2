const express = require("express");
const { simulate } = require("./processHelper");
const cors = require("cors");

const app = express();
const corsOptions = {
  origin: "*",
  methods: "*",
  allowedHeaders: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 8080;

// for demonstration purpose
simulate();

app.use("/api/internal/processes", require("./routes/api/internal"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
