import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});
const systemMessage = {
    role: "system",
    content: `You parse product info into JSON, such as:
  {
    "title": "Coca-Cola Original Taste",
    "quantity": 24,
    "unit": {
      "amount": 330,
      "measurementUnit": "ml"
    },
    "ingredients": [
      {
        "ingredient": "Sugar"
      },
      {
        "ingredient": "Caramel",
        "code": "E150d"
      },
      {
        "ingredient": "Sodium Carbonates",
      },
      {
        "ingredient": "Phosphoric Acid",
      }
    ]
  }

  or

  {
    "title": "Chicken Chow Mein",
    "quantity": 550,
    "unitOfMeasurement": "g",
    "ingredients": [
      {
        "name": "Cooked marinated chicken",
        "percentage": 19,
        "ingredients": [
          {
            "name": "chicken breast",
            "percentage": 97
          }
        ]
      },
      {
        "name": "yeast extract",
        "contains": "barley"
      }
    ]
  }
only use "contains" if specifically stated.
 stick to naming in the examples. if the "unitOfMeasurement" is simple (ie g, kg, ml etc) don't put it inside "unit"
 parse user passed products.
 if it satates the weight as from to, such as "1.3kg - 1.7kg" choose the smaller one (1.3kg)
`,
};
export default async function parse(text) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [systemMessage, { role: "user", content: text }],
        model: "gpt-4",
        temperature: 0.5,
        response_format: { type: "json_object" },
    });
    if (chatCompletion.choices[0].finish_reason == "stop") {
        return chatCompletion.choices[0].message.content;
    }
}
//# sourceMappingURL=ai.js.map