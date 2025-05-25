package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
	"web-builder/internal/constants"
	"web-builder/internal/prompts"
	"web-builder/internal/templates"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.0-flash-lite")
	chatModel := client.GenerativeModel("gemini-2.0-flash")

	r := gin.Default()

	// cors
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Type"}
	r.Use(cors.New(config))

	r.POST("/template", func(c *gin.Context) {
		var req struct {
			Prompt string `json:"prompt"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		resp, err := model.GenerateContent(ctx, genai.Text(req.Prompt),
			genai.WithSystemInstruction("This is a user prompt, figure out whether the user is talking about a react project or a node project. Respond with a single word, either 'react' or 'node'. Do not add any other text."),
			genai.WithMaxOutputTokens(1),
		)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		type_ := resp.Candidates[0].Content.Parts[0].(genai.Text)
		type_ = genai.Text(strings.ToLower(strings.TrimSpace(string(type_))))

		if type_ == "react" {
			c.JSON(200, gin.H{
				"base": []string{
					constants.BasePrompt,
					"Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you. " + templates.ReactTemplate + " \nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.",
				},
				"defaultFiles": []string{templates.ReactTemplate},
			})
			return
		}

		if type_ == "node" {
			c.JSON(200, gin.H{
				"base": []string{
					"Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you. " + templates.NodeTemplate + " \nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.",
				},
				"defaultFiles": []string{templates.NodeTemplate},
			})
			return
		}

		c.JSON(400, gin.H{"error": "Unexpected response from AI model."})
	})

	r.POST("/chat", func(c *gin.Context) {
		var req struct {
			Messages []genai.Content `json:"messages"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		resp, err := chatModel.GenerateContent(ctx, req.Messages,
			genai.WithSystemInstruction(prompts.SystemPrompt),
			genai.WithMaxOutputTokens(10000),
			genai.WithTemperature(0.1),
		)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"response": resp.Candidates[0].Content.Parts[0]})
	})

	if err := r.Run(":8000"); err != nil {
		log.Fatal(err)
	}
} 