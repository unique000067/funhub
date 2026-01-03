const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req,res)=>{
  res.send("🔥 FunHub Backend Running");
});

app.listen(process.env.PORT, ()=>{
  console.log(`🚀 Server started on port ${process.env.PORT}`);
});
