const prompt = require("prompt-sync")({ sigint: true });
const {
  getUserInformation,
  ewebAuthentication,
  getAllSites,
  getControllersFromSite,
  createBdeInTargetController,
} = require("./eWEBHelpers");

let quitSignal = "";
const creds = getUserInformation();

async function app() {
  while (quitSignal.toLowerCase() !== "q") {
    console.clear();
    const { response } = await ewebAuthentication(creds);
    let controllers;
    if (response) {
      if (response.value === "OK") {
        console.clear();
        const sites = await getAllSites(creds);
        console.log("-----Sites-----");
        sites.forEach((value, index) => console.log(`${index + 1}. ${value}`));
        let userSelectedSite = prompt(
          "Select a site by typing in the numerical value: "
        );

        let site;
        while (true) {
          site = sites[userSelectedSite - 1];
          if (site) {
            console.log(site);
            controllers = await getControllersFromSite(creds, site);
            break;
          } else {
            console.clear();
            console.log(
              "\nNot a valid site selection. Please select from the list of given sites."
            );
            console.log("-----Sites-----");
            sites.forEach((value, index) =>
              console.log(`${index + 1}. ${value}`)
            );
            userSelectedSite = prompt(
              "Select a site by typing in the numerical value: "
            );
          }
        }

        console.clear();
        console.log(`-----Controllers at ${sites[userSelectedSite - 1]}----- `);
        for (const key in controllers) {
          console.log(`${key}: ${controllers[key]}`);
        }

        let targetController;
        while (true) {
          targetController = prompt(
            "Select the target controller (by address): "
          );
          if (parseInt(targetController)) {
            console.log(controllers[targetController]);
            break;
          }
          console.log("Not a valid controller selection.");
        }

        let rootController;
        while (true) {
          rootController = prompt(
            "Select a controller to make a BDE for in target controller (by address): "
          );
          if (parseInt(rootController)) {
            console.log(controllers[rootController]);
            break;
          }
          console.log("Not a valid controller selection.");
        }

        await createBdeInTargetController(
          creds,
          site,
          targetController,
          controllers[rootController]
        );
      } else {
        console.log(response);
      }
    } else {
      console.log("No credntials given.");
    }

    console.log('Press Q to quit or press any "Enter" button to continue');
    quitSignal = prompt();
  }
}

app();
