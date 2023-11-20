const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();

// URL de la page web à surveiller
const url = "https://clubs.fsgt38.org/equipe/classement/463";

// Configuration pour nodemailer (utilisez votre propre configuration)
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
});

// Variables pour stocker l'état précédent
let previousStandings = null;

// Fonction pour récupérer et comparer le classement
async function checkStandings() {
  try {
    // Effectuer la requête HTTP pour obtenir le HTML de la page
    const response = await axios.get(url);
    const html = response.data;

    // Charger le HTML dans Cheerio pour le manipuler plus facilement
    const $ = cheerio.load(html);

    // Sélectionner les éléments qui contiennent les informations sur le classement
    const standingsTable = $("#table-classement tbody tr");

    // Créer une structure de données pour stocker le classement actuel
    const currentStandings = [];

    standingsTable.each((index, element) => {
      const teamName = $(element).find(".equipe").text().trim();
      const gamesPlayed = parseInt($(element).find(".joue").text().trim());

      currentStandings.push({
        teamName,
        gamesPlayed,
      });
    });

    // Comparer le classement actuel avec le classement précédent
    if (
      JSON.stringify(currentStandings) !== JSON.stringify(previousStandings)
    ) {
      // Le classement a changé, envoyer un e-mail
      sendEmail(currentStandings);

      // Mettre à jour le classement précédent
      previousStandings = currentStandings;
    } else {
      console.log("Le classement n'a pas changé.");
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du classement :",
      error.message
    );
  }
}

// Fonction pour envoyer un e-mail
function sendEmail(standings) {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: process.env.MAIL_TO_USER,
    subject: "Changement de classement",
    text: `Le classement a changé :\n\n${JSON.stringify(standings, null, 2)}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(
        "Erreur lors de l'envoi de l'e-mail :",
        error.message
      );
    }
    console.log("E-mail envoyé :", info.response);
  });
}

// Exécuter la fonction checkStandings toutes les 60 secondes
setInterval(checkStandings, 10000);
console.log("test");
