const router = require(`express`).Router()
const usersModel = require(`../models/users`)
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var createError = require('http-errors')

router.get('/Users', (req, res) => 
{
    usersModel.find({}, (error, data) =>
    {
        if(!error){
            res.json(data)
        }
    })
})

router.post('/Users/validateUser', (req, res) => 
{
    console.log(req.headers.Authorization)
    //we verify the user and return name, access level and token in order to avoid changes in web from changing the access level in app display on dev tools
    jwt.verify(req.headers.Authorization, process.env.JWT_PRIVATE_KEY, {algorithm: "HS256"}, (err, decodedToken) => {

        if( typeof decodedToken  == 'undefined'){
            console.log(decodedToken)
            res.json({accessLevel: 0})
        }else{
            console.log(decodedToken.accessLevel)
            res.json({accessLevel: decodedToken.accessLevel})
        }
        
    })
})

router.post(`/Users/resetUsers`, (req,res) => 
{
    usersModel.deleteMany({}, (error, data) => 
    {
        if(data)
        {
            bcrypt.hash(process.env.ADMIN_PASSWORD.toString(), parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (err, hash) =>  
            {
                usersModel.create({name:"Administrator", email:"admin@admin.com", password:hash, accessLevel:parseInt(process.env.ACCESS_LEVEL_ADMIN)}, (createError, createData) => 
                {
                    if(createData)
                    {
                        res.json(createData)
                    }
                    else
                    {
                        res.json({errorMessage:`Failed to create Admin user for testing purposes`})
                    }
                })
            })
        }
        else
        {
            res.json({errorMessage:`User is not logged in`})
        }
    })                
})


router.post(`/Users/register/:name/:email/:password`, (req,res) => {
    // If a user with this email does not already exist, then create new user
    usersModel.findOne({email:req.params.email}, (uniqueError, uniqueData) => 
    {
        if(uniqueData)
        {
            res.json({errorMessage:`User already exists`})
        }
        else
        {
            bcrypt.hash(req.params.password, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (err, hash) =>  
            {
                usersModel.create({name:req.params.name,email:req.params.email,password:hash, accessLevel: process.env.ACCESS_LEVEL_NORMAL_USER}, (error, data) => 
                {
                    if(data)
                    {
                        const token = jwt.sign({name:data.name, email:data.email, accessLevel:data.accessLevel}, process.env.JWT_PRIVATE_KEY, {algorithm:'HS256', expiresIn:process.env.JWT_EXPIRY})     
           
                        res.json({name: data.name, accessLevel:data.accessLevel, token:token})
                    }
                    else
                    {
                        res.json({errorMessage:`User was not registered`})
                    }
                }) 
            })
        }
    })         
})
 

router.post(`/Users/login/:email/:password`, (req,res) => 
{
    usersModel.findOne({email:req.params.email}, (error, data) => 
    {
        if(data)
        {
            console.log(req.params.password, data.password)
            bcrypt.compare(req.params.password, data.password, (err, result) =>
            {
                if(!result){
                    res.json(createError(400, `Password or Email are incorrect, please try again.`))
                }else{
                    const token = jwt.sign({email:data.email, accessLevel:data.accessLevel}, process.env.JWT_PRIVATE_KEY, {algorithm:'HS256', expiresIn:process.env.JWT_EXPIRY})     
           
                    res.json({name: data.name, accessLevel:data.accessLevel, token:token})
                }
               /*  if(result)
                {
                    const token = jwt.sign({email:data.email, accessLevel:data.accessLevel}, process.env.JWT_PRIVATE_KEY, {algorithm:'HS256', expiresIn:process.env.JWT_EXPIRY})     
           
                    res.json({name: data.name, accessLevel:data.accessLevel, token:token})
                }
                else
                {
                    res.json({errorMessage:`User is not logged in`})
                } */
            })
        }
        else
        {
            console.log("not found in db")
            res.json(createError(400, `Password or Email are incorrect, please try again.`))
        } 
    })
})


router.post(`/Users/logout`, (req,res) => {       
    res.json({})
})
    

module.exports = router