const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ===== SIGNUP ===== */
router.post("/signup", async(req,res)=>{
  const {username,email,password} = req.body;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = new User({username,email,password:hash});
  await user.save();

  res.json({msg:"Signup success"});
});

/* ===== LOGIN ===== */
router.post("/login", async(req,res)=>{
  const {email,password} = req.body;

  const user = await User.findOne({email});
  if(!user) return res.status(400).json({msg:"User not found"});

  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.status(400).json({msg:"Wrong password"});

  const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
  res.json({token, username:user.username});
});

module.exports = router;
