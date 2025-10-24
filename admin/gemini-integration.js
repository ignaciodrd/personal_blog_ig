// Espera a que la página se cargue y el objeto CMS esté disponible
window.addEventListener('load', () => {
  // Comprueba si Decap CMS se ha cargado
  if (window.CMS) {
    
    /**
     * Función para llamar a la API de Gemini
     */
    const callGeminiAPI = async (userPrompt) => {
      // Deja la clave API vacía. El entorno la proporcionará.
      const apiKey = ""; 
      const apiUrl = `https://generativelace.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      // El "system prompt" le da la personalidad y el formato que queremos
      const systemPrompt = "Eres un asistente de blog. Escribe un borrador de artículo de blog basado en el siguiente tema. El artículo debe estar en español, tener un tono casual y amigable, y estar formateado en Markdown (usando ## para subtítulos, * para cursivas, etc). No incluyas un título principal, solo el cuerpo del artículo.";

      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Error de API: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content.parts[0].text) {
          return result.candidates[0].content.parts[0].text;
        } else {
          throw new Error("Respuesta inesperada de la API de Gemini.");
        }
      } catch (error) {
        console.error("Error llamando a Gemini:", error);
        return "*(Hubo un error al generar el texto. Revisa la consola para más detalles.)*";
      }
    };

    /**
     * Crea un componente de React (usando la sintaxis antigua que expone Decap)
     */
    const GeminiGeneratorControl = window.createClass({
      // Esta es la función que se llama cuando haces clic en el botón
      action: async function() {
        const topic = prompt(
          "✨ Generador de Borrador con IA ✨\n\n¿Sobre qué tema quieres que escriba?\n(Ej: 'mi viaje a la costa', 'una reseña del nuevo libro de...')"
        );
        
        if (topic) {
          try {
            // Informa al usuario que estamos trabajando
            this.props.editor.onChange("*(✨ Generando borrador con IA... por favor espera...)*");
            
            // Llama a la API
            const generatedText = await callGeminiAPI(topic);
            
            // Reemplaza el texto de "cargando" con el borrador de IA
            this.props.editor.onChange(generatedText);
          } catch (error) {
            console.error("Error al generar con Gemini:", error);
            this.props.editor.onChange(`*(Error al generar el texto. Revisa la consola para más detalles.)*`);
          }
        }
      },

      // Cómo se ve el botón en la barra de herramientas
      render: function() {
        // `h` es la función `createElement` de React que Decap nos da
        return window.h(
          'button', // Tipo de elemento
          { // Atributos
            type: 'button',
            title: 'Generar borrador con IA',
            // Decap CMS aplica sus propios estilos a los botones de la barra
            className: 'EditorControl' 
          },
          '✨ IA' // Texto/Icono del botón
        );
      }
    });

    /**
     * Registra nuestro componente de IA en la barra de herramientas
     */
    window.CMS.registerEditorComponent({
      id: 'gemini-generator',   // ID único
      label: '✨ Generar IA',  // Etiqueta en el menú
      // Le decimos que solo aparezca en el campo 'body' 
      // (así se llama en tu admin/config.yml)
      field: 'body',
      // El componente que creamos arriba
      control: GeminiGeneratorControl
    });

    console.log("¡Integración de Gemini para Decap CMS cargada!");

  } else {
    console.warn("Decap CMS (window.CMS) no encontrado. La integración de Gemini no se cargará.");
  }
});
