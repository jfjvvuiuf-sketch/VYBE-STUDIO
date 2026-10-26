import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
const app=express(),PORT=process.env.PORT||10000;
app.use(express.json());
app.use(cors({origin:process.env.FRONTEND_URL,credentials:true}));
app.get("/",(_,res)=>res.json({ok:true,service:"VYBE Studio API"}));

app.get("/auth/tiktok",(req,res)=>{
 const state=crypto.randomBytes(32).toString("hex");
 const p=new URLSearchParams({client_key:process.env.TIKTOK_CLIENT_KEY,response_type:"code",scope:process.env.TIKTOK_SCOPES||"user.info.basic",redirect_uri:`${process.env.BACKEND_URL}/auth/tiktok/callback`,state});
 res.redirect("https://www.tiktok.com/v2/auth/authorize/?"+p);
});
app.get("/auth/tiktok/callback",async(req,res)=>{
 try{
  if(req.query.error)return res.redirect(`${process.env.FRONTEND_URL}/?connection=tiktok&status=denied`);
  if(!req.query.code||!req.query.state)return res.status(400).send("Incomplete TikTok OAuth response.");
  const r=await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_key:process.env.TIKTOK_CLIENT_KEY,client_secret:process.env.TIKTOK_CLIENT_SECRET,code:req.query.code,grant_type:"authorization_code",redirect_uri:`${process.env.BACKEND_URL}/auth/tiktok/callback`})});
  const d=await r.json();if(!r.ok)return res.status(400).json(d);
  console.log("TikTok OAuth succeeded",d.data?.open_id);
  res.redirect(`${process.env.FRONTEND_URL}/?connection=tiktok&status=connected`);
 }catch(e){console.error(e);res.status(500).send("TikTok connection failed.")}
});
app.get("/auth/youtube",(req,res)=>{
 const p=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:`${process.env.BACKEND_URL}/auth/youtube/callback`,response_type:"code",scope:"https://www.googleapis.com/auth/youtube.readonly",access_type:"offline",prompt:"consent"});
 res.redirect("https://accounts.google.com/o/oauth2/v2/auth?"+p);
});
app.get("/auth/youtube/callback",async(req,res)=>{
 try{
  if(!req.query.code)return res.status(400).send("Missing YouTube code.");
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code:req.query.code,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,redirect_uri:`${process.env.BACKEND_URL}/auth/youtube/callback`,grant_type:"authorization_code"})});
  const d=await r.json();if(!r.ok)return res.status(400).json(d);
  console.log("YouTube OAuth succeeded");
  res.redirect(`${process.env.FRONTEND_URL}/?connection=youtube&status=connected`);
 }catch(e){console.error(e);res.status(500).send("YouTube connection failed.")}
});
app.get("/auth/instagram",(_,res)=>res.status(501).send("Configure your Meta/Instagram OAuth app before enabling this route."));
app.listen(PORT,"0.0.0.0",()=>console.log("VYBE API on "+PORT));