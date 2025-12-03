const express = require('express');
const mysql = require('mysql');

const app = express();

const db = mysql.createConnection({ host: "localhost", user: "root", password: "Four.Dain.30"});
db.connect(function(err) {
    if (err) throw err;
    console.log("Connecté à la base de données MySQL !");
})

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/api/cadets', (req, res, next) => {
    const cadets = [
        {
            id: 'cadet1',
            lastname: 'Bob',
            firstname: 'Dylan',
            email: 'bob.dylan@gmail.com',
            status: 'Actif',
            phone: '+33 06 98 76 54 32',
            phoneParent: '+33 07 99 78 55 33',
            dateOfBirth: '22/08/2009',
            role: 'Cadet',
            courseAccess: true,
            createdAt: "2025-01-10T10:30:00Z",
            updatedAt: "2025-01-15T14:20:00Z"
        },
        {
            id: 'cadet2',
            lastname: 'Bob1',
            firstname: 'Dylan1',
            email: 'bob1.dylan1@gmail.com',
            phone: '+33 06 98 76 54 32',
            phoneParent: '+33 07 99 78 55 33',
            dateOfBirth: '22/08/2009',
            role: 'Cadet',
            status: 'Actif',
            courseAccess: true,
            createdAt: "2025-01-10T10:30:00Z",
            updatedAt: "2025-01-15T14:20:00Z"
        },
        {
            id: 'cadet2',
            lastname: 'Bob2',
            firstname: 'Dylan2',
            email: 'bob2.dylan2@gmail.com',
            phone: '+33 06 98 76 54 32',
            phoneParent: '+33 07 99 78 55 33',
            dateOfBirth: '22/08/2009',
            role: 'Cadet',
            status: 'Actif',
            courseAccess: true,
            createdAt: "2025-01-10T10:30:00Z",
            updatedAt: "2025-01-15T14:20:00Z"
        },
    ];
    res.status(200).json({
        success: true,
        data: {
            cadets: cadets,
            total: cadets.length
        }
    });
})


app.use('/api/candidats', (req, res, next) =>  {
    const candidats = [
        {
            id: 'candidat1',
            lastname: 'John',
            firstname: 'Deer',
            email: 'john.deer@gmail.com',
            emailParent: 'Maman.deer@gamil.com',
            password: 'johnDeer',
            cityCode: '80000',
            sexe: 'Homme',
        },
        {
            id: 'candidat2',
            lastname: 'Léa',
            firstname: 'Test',
            email: 'lea.test@gmail.com',
            emailParent: 'Maman.lea@gmail.com',
            password: 'leaTest',
            cityCode: '80480',
            sexe: 'Feminin'
        }
    ];
    res.status(200).json({
        success: true,
        data: {
            candidats: candidats,
            total: candidats.length
        }
    })
})

app.post('/api/candidats/register', (req, res, next) => {
    console.log(req.body);
    res.status(201).json({
        message: 'Inscription réalisé avec succés !'
    });
})

module.exports = app;