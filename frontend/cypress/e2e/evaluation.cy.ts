const API = "**/api/v1";

const technician = {
  id: 9001,
  name: "Técnico de prueba",
  email: "tecnico.pruebas@yakuai.test",
  role: "tecnico",
};

const plot = {
  id: 41,
  farmer_id: 12,
  name: "Parcela de prueba",
  latitude: "-12.071",
  longitude: "-75.209",
  boundary: null,
  area_m2: "1200.00",
  area_origin: "manual",
  crop_id: 1,
  sowing_date: "2026-01-15",
  soil_texture_code: "franco",
  irrigation_system: "goteo",
  irrigation_efficiency: "0.85",
  flow_lpm: "12.00",
  status: "activa",
  crop: { id: 1, code: "papa", name: "Papa", scientific_name: null, is_active: true },
};

function paginated(data: unknown[]) {
  return { data, current_page: 1, last_page: 1, total: data.length };
}

function evaluation(result: "riega" | "no" | "incompleta", id = 901) {
  return {
    id,
    plot_id: plot.id,
    evaluated_at: "2026-11-09T15:00:00.000Z",
    stage: "med",
    inputs_snapshot: {
      soil_moisture_pct: 24,
      threshold_pct: 35,
      forecast_rain_mm: 0,
      forecast_probability_pct: 10,
      crop_name: "Papa",
      soil_texture_code: "franco",
    },
    result,
    min_liters: result === "riega" ? "300.00" : null,
    max_liters: result === "riega" ? "450.00" : null,
    confidence: "alta",
    reason: result === "incompleta" ? "sin_humedad_valida" : result === "riega" ? "humedad_baja" : "humedad_suficiente",
    next_at: null,
    is_critical: false,
    plot,
  };
}

function installSessionApi() {
  cy.intercept("POST", `${API}/auth/login`, {
    statusCode: 200,
    body: {
      data: {
        access_token: "cypress-session-token",
        token_type: "Bearer",
        expires_at: "2026-12-31T23:59:59Z",
        user: technician,
      },
    },
  }).as("login");
  cy.intercept("GET", `${API}/auth/me`, { body: { data: technician } }).as("me");
  cy.intercept("GET", `${API}/plots*`, { body: paginated([plot]) }).as("plots");
  cy.intercept("GET", `${API}/evaluations*`, { body: paginated([]) }).as("history");
  cy.intercept("POST", `${API}/plots/${plot.id}/weather/refresh`, { statusCode: 200, body: { data: {} } }).as("weather");
}

function signInAndOpenEvaluation() {
  cy.visit("/login");
  cy.get("#access-email").type(technician.email);
  cy.get("#access-secret").type("ClaveDePrueba123");
  cy.contains("button", "Iniciar sesión").click();
  cy.wait("@login");
  cy.location("pathname").should("eq", "/");
  cy.visit("/evaluar");
  cy.wait("@me");
}

describe("Macroproceso: evaluación y recomendación de riego", () => {
  it("EVAL-E2E-01 protege la pantalla cuando no hay sesión", () => {
    cy.visit("/evaluar", { onBeforeLoad: (window) => window.localStorage.clear() });
    cy.location("pathname").should("eq", "/login");
    cy.contains("h1", "Entra a tu campo").should("be.visible");
  });

  it("EVAL-E2E-02 informa cuando el usuario no tiene parcelas", () => {
    installSessionApi();
    cy.intercept("GET", `${API}/plots*`, { body: paginated([]) }).as("noPlots");
    signInAndOpenEvaluation();
    cy.wait("@noPlots");
    cy.get("h1").should("contain.text", "Evaluar riego");
    cy.contains("Sin parcelas disponibles").should("be.visible");
  });

  it("EVAL-E2E-03 muestra una recomendación cuando corresponde regar", () => {
    installSessionApi();
    cy.intercept("POST", `${API}/plots/${plot.id}/evaluate`, {
      statusCode: 201,
      body: { data: evaluation("riega") },
    }).as("evaluateWater");
    signInAndOpenEvaluation();
    cy.contains("button", "Evaluar ahora").click();
    cy.wait("@weather");
    cy.wait("@evaluateWater");
    cy.contains("h2", "Es momento de regar").should("be.visible");
    cy.contains("Riego recomendado").should("be.visible");
    cy.contains("Volumen recomendado").should("be.visible");
    cy.contains("300").should("be.visible");
    cy.contains("450").should("be.visible");
    cy.screenshot("01-recomendacion-de-riego", { capture: "viewport" });
  });

  it("EVAL-E2E-04 comunica cuando la humedad es suficiente", () => {
    installSessionApi();
    cy.intercept("POST", `${API}/plots/${plot.id}/evaluate`, {
      statusCode: 201,
      body: { data: evaluation("no", 902) },
    }).as("evaluateNoWater");
    signInAndOpenEvaluation();
    cy.contains("button", "Evaluar ahora").click();
    cy.wait("@weather");
    cy.wait("@evaluateNoWater");
    cy.contains("h2", "No es necesario regar").should("be.visible");
    cy.contains("Humedad suficiente").should("be.visible");
    cy.contains("No hace falta regar ahora").should("be.visible");
  });

  it("EVAL-E2E-05 explica que faltan datos para decidir", () => {
    installSessionApi();
    cy.intercept("POST", `${API}/plots/${plot.id}/evaluate`, {
      statusCode: 422,
      body: { data: evaluation("incompleta", 903) },
    }).as("evaluateIncomplete");
    signInAndOpenEvaluation();
    cy.contains("button", "Evaluar ahora").click();
    cy.wait("@weather");
    cy.wait("@evaluateIncomplete");
    cy.contains("h2", "Revisar datos").should("be.visible");
    cy.contains("Faltan datos para decidir").should("be.visible");
    cy.contains("Revisar sensores").should("be.visible");
  });

  it("EVAL-E2E-06 confirma que la API local de YakuAI está disponible", () => {
    cy.request("GET", "/api/v1/health").its("status").should("eq", 200);
  });
});




