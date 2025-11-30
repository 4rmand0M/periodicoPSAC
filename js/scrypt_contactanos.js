emailjs.init("GDiZTwrCjV1aq9Bxj");

// Evento del formulario
document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();

    // Elementos
    const statusDiv = document.getElementById("status");
    const sendBtn = document.getElementById("sendBtn");

    // Mostrar animación de envío
    statusDiv.className = "status-loading";
    statusDiv.textContent = "⏳ Enviando mensaje...";
    statusDiv.style.display = "block";
    sendBtn.classList.add("loading");
    sendBtn.disabled = true;

    // Datos a enviar
    const params = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value
    };

    // Enviar mensaje con EmailJS
    emailjs.send("service_xt7fs7w", "template_xmrrv6l", params)
        .then(() => {
            statusDiv.className = "status-success";
            statusDiv.textContent = "✔️ Mensaje enviado correctamente";

            // Resetear formulario
            document.getElementById("contactForm").reset();
        })
        .catch(() => {
            statusDiv.className = "status-error";
            statusDiv.textContent = "❌ Error al enviar el mensaje. Inténtalo nuevamente.";
        })
        .finally(() => {
            sendBtn.classList.remove("loading");
            sendBtn.disabled = false;
        });
});