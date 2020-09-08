const template = (websiteUrl, username, activateUrl) => `
Bienvenu à la Promo! <br /> <br />

Votre compte a été créé sur ${websiteUrl} avec l'identifiant ${username}. <br />

Pour activer votre compte, <a href="${activateUrl}">cliquez ici</a> ou visiter le lien suivant: ${activateUrl}
`;

export default template;
