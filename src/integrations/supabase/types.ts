export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      diagnostic_questions: {
        Row: {
          correct_answer: string
          created_at: string
          diagnostic_test_id: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          hints: Json | null
          id: string
          order_index: number
          question: string
          subtopic_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          diagnostic_test_id: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          hints?: Json | null
          id?: string
          order_index?: number
          question: string
          subtopic_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          diagnostic_test_id?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          hints?: Json | null
          id?: string
          order_index?: number
          question?: string
          subtopic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_questions_diagnostic_test_id_fkey"
            columns: ["diagnostic_test_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_questions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_responses: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          diagnostic_question_id: string
          id: string
          is_correct: boolean
          misconception_tag: string | null
          time_spent_seconds: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          diagnostic_question_id: string
          id?: string
          is_correct: boolean
          misconception_tag?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          diagnostic_question_id?: string
          id?: string
          is_correct?: boolean
          misconception_tag?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_responses_diagnostic_question_id_fkey"
            columns: ["diagnostic_question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_responses_diagnostic_question_id_fkey"
            columns: ["diagnostic_question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          questions_answered: number
          started_at: string | null
          status: Database["public"]["Enums"]["diagnostic_status"]
          topic_id: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_answered?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["diagnostic_status"]
          topic_id: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_answered?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["diagnostic_status"]
          topic_id?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_tests_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          ai_feedback: string | null
          created_at: string
          exercise_id: string
          explanation_variant: number | null
          hints_used: number | null
          id: string
          is_correct: boolean
          misconception_tag: string | null
          time_spent_seconds: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string
          exercise_id: string
          explanation_variant?: number | null
          hints_used?: number | null
          id?: string
          is_correct: boolean
          misconception_tag?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string
          exercise_id?: string
          explanation_variant?: number | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean
          misconception_tag?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          explanation: string | null
          hints: string[] | null
          id: string
          question: string
          subtopic_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          hints?: string[] | null
          id?: string
          question: string
          subtopic_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          hints?: string[] | null
          id?: string
          question?: string
          subtopic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_check_responses: {
        Row: {
          attempts: number
          check_question: string
          correct_answer: string | null
          created_at: string
          hint_used: boolean
          id: string
          is_correct: boolean
          subtopic_id: string | null
          subtopic_name: string
          time_spent_seconds: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          check_question: string
          correct_answer?: string | null
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct: boolean
          subtopic_id?: string | null
          subtopic_name: string
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          check_question?: string
          correct_answer?: string | null
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          subtopic_id?: string | null
          subtopic_name?: string
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_check_responses_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_nodes: {
        Row: {
          created_at: string | null
          estimated_minutes: number | null
          goal_id: string | null
          id: string
          order_index: number
          scheduled_date: string
          status: string | null
          subtopic_id: string | null
          target_difficulty: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          order_index: number
          scheduled_date: string
          status?: string | null
          subtopic_id?: string | null
          target_difficulty?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_minutes?: number | null
          goal_id?: string | null
          id?: string
          order_index?: number
          scheduled_date?: string
          status?: string | null
          subtopic_id?: string | null
          target_difficulty?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_nodes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_learning_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_nodes_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_nodes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_profiles: {
        Row: {
          created_at: string
          id: string
          learning_style_notes: string | null
          misconception_patterns: Json
          overall_level: number
          recommended_starting_subtopic: string | null
          strengths: Json
          subtopic_levels: Json
          topic_id: string
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          created_at?: string
          id?: string
          learning_style_notes?: string | null
          misconception_patterns?: Json
          overall_level?: number
          recommended_starting_subtopic?: string | null
          strengths?: Json
          subtopic_levels?: Json
          topic_id: string
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          created_at?: string
          id?: string
          learning_style_notes?: string | null
          misconception_patterns?: Json
          overall_level?: number
          recommended_starting_subtopic?: string | null
          strengths?: Json
          subtopic_levels?: Json
          topic_id?: string
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "learning_profiles_recommended_starting_subtopic_fkey"
            columns: ["recommended_starting_subtopic"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_profiles_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          average_time_per_exercise: number | null
          correct_answers: number | null
          created_at: string
          difficulty_progression: Json | null
          dominant_emotion: string | null
          duration_minutes: number | null
          ended_at: string | null
          exercise_timings: Json | null
          final_difficulty: string | null
          hints_used: number | null
          id: string
          problems_solved: number | null
          session_goal: string | null
          session_summary: string | null
          started_at: string
          starting_difficulty: string | null
          topics_covered: string[] | null
          total_attempts: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          average_time_per_exercise?: number | null
          correct_answers?: number | null
          created_at?: string
          difficulty_progression?: Json | null
          dominant_emotion?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          exercise_timings?: Json | null
          final_difficulty?: string | null
          hints_used?: number | null
          id?: string
          problems_solved?: number | null
          session_goal?: string | null
          session_summary?: string | null
          started_at?: string
          starting_difficulty?: string | null
          topics_covered?: string[] | null
          total_attempts?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          average_time_per_exercise?: number | null
          correct_answers?: number | null
          created_at?: string
          difficulty_progression?: Json | null
          dominant_emotion?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          exercise_timings?: Json | null
          final_difficulty?: string | null
          hints_used?: number | null
          id?: string
          problems_solved?: number | null
          session_goal?: string | null
          session_summary?: string | null
          started_at?: string
          starting_difficulty?: string | null
          topics_covered?: string[] | null
          total_attempts?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      level_assessment_results: {
        Row: {
          answered_parts: number
          completed_at: string
          created_at: string
          id: string
          overall_percentage: number
          strong_topics: string[] | null
          time_spent_minutes: number
          topic_scores: Json
          topics_assessed: Json
          total_parts: number
          total_questions: number
          user_id: string
          weak_topics: string[] | null
        }
        Insert: {
          answered_parts: number
          completed_at?: string
          created_at?: string
          id?: string
          overall_percentage: number
          strong_topics?: string[] | null
          time_spent_minutes: number
          topic_scores?: Json
          topics_assessed?: Json
          total_parts: number
          total_questions: number
          user_id: string
          weak_topics?: string[] | null
        }
        Update: {
          answered_parts?: number
          completed_at?: string
          created_at?: string
          id?: string
          overall_percentage?: number
          strong_topics?: string[] | null
          time_spent_minutes?: number
          topic_scores?: Json
          topics_assessed?: Json
          total_parts?: number
          total_questions?: number
          user_id?: string
          weak_topics?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          academic_interest: string | null
          avatar_url: string | null
          comprehensive_diagnostic_completed: boolean
          comprehensive_diagnostic_completed_at: string | null
          created_at: string
          current_streak: number
          detected_learning_style: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_practice_date: string | null
          last_session_mood: string | null
          learning_path_generated_at: string | null
          longest_streak: number
          notify_achievements: boolean | null
          notify_community_mentions: boolean | null
          notify_daily_reminder: boolean | null
          notify_new_courses: boolean | null
          notify_weekly_progress: boolean | null
          onboarding_completed: boolean | null
          privacy_marketing_emails: boolean | null
          privacy_public_profile: boolean | null
          privacy_usage_analytics: boolean | null
          session_count: number | null
          target_mastery_date: string | null
          total_xp: number
          updated_at: string
          username: string | null
        }
        Insert: {
          about_me?: string | null
          academic_interest?: string | null
          avatar_url?: string | null
          comprehensive_diagnostic_completed?: boolean
          comprehensive_diagnostic_completed_at?: string | null
          created_at?: string
          current_streak?: number
          detected_learning_style?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_practice_date?: string | null
          last_session_mood?: string | null
          learning_path_generated_at?: string | null
          longest_streak?: number
          notify_achievements?: boolean | null
          notify_community_mentions?: boolean | null
          notify_daily_reminder?: boolean | null
          notify_new_courses?: boolean | null
          notify_weekly_progress?: boolean | null
          onboarding_completed?: boolean | null
          privacy_marketing_emails?: boolean | null
          privacy_public_profile?: boolean | null
          privacy_usage_analytics?: boolean | null
          session_count?: number | null
          target_mastery_date?: string | null
          total_xp?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          about_me?: string | null
          academic_interest?: string | null
          avatar_url?: string | null
          comprehensive_diagnostic_completed?: boolean
          comprehensive_diagnostic_completed_at?: string | null
          created_at?: string
          current_streak?: number
          detected_learning_style?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_practice_date?: string | null
          last_session_mood?: string | null
          learning_path_generated_at?: string | null
          longest_streak?: number
          notify_achievements?: boolean | null
          notify_community_mentions?: boolean | null
          notify_daily_reminder?: boolean | null
          notify_new_courses?: boolean | null
          notify_weekly_progress?: boolean | null
          onboarding_completed?: boolean | null
          privacy_marketing_emails?: boolean | null
          privacy_public_profile?: boolean | null
          privacy_usage_analytics?: boolean | null
          session_count?: number | null
          target_mastery_date?: string | null
          total_xp?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      student_session_notes: {
        Row: {
          content: string
          detected_at: string
          id: string
          mastered_at: string | null
          note_type: string
          personal_note: string | null
          related_entry_id: string | null
          subtopic_name: string | null
          user_id: string
        }
        Insert: {
          content: string
          detected_at?: string
          id?: string
          mastered_at?: string | null
          note_type: string
          personal_note?: string | null
          related_entry_id?: string | null
          subtopic_name?: string | null
          user_id: string
        }
        Update: {
          content?: string
          detected_at?: string
          id?: string
          mastered_at?: string | null
          note_type?: string
          personal_note?: string | null
          related_entry_id?: string | null
          subtopic_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_session_notes_related_entry_id_fkey"
            columns: ["related_entry_id"]
            isOneToOne: false
            referencedRelation: "student_session_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          theory_explanation: string | null
          topic_id: string
          worked_examples: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          theory_explanation?: string | null
          topic_id: string
          worked_examples?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          theory_explanation?: string | null
          topic_id?: string
          worked_examples?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_bookmarks: {
        Row: {
          bookmark_type: string
          content: string
          created_at: string
          id: string
          note: string | null
          subtopic_id: string | null
          subtopic_name: string
          user_id: string
        }
        Insert: {
          bookmark_type?: string
          content: string
          created_at?: string
          id?: string
          note?: string | null
          subtopic_id?: string | null
          subtopic_name: string
          user_id: string
        }
        Update: {
          bookmark_type?: string
          content?: string
          created_at?: string
          id?: string
          note?: string | null
          subtopic_id?: string | null
          subtopic_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_bookmarks_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_exam_results: {
        Row: {
          created_at: string | null
          id: string
          is_exam_ready: boolean
          mistake_patterns: Json | null
          questions_correct: number
          score_percentage: number
          subtopic_scores: Json
          time_spent_minutes: number
          topic_id: string
          total_questions: number
          user_id: string
          weak_subtopics: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_exam_ready?: boolean
          mistake_patterns?: Json | null
          questions_correct: number
          score_percentage: number
          subtopic_scores?: Json
          time_spent_minutes: number
          topic_id: string
          total_questions: number
          user_id: string
          weak_subtopics?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_exam_ready?: boolean
          mistake_patterns?: Json | null
          questions_correct?: number
          score_percentage?: number
          subtopic_scores?: Json
          time_spent_minutes?: number
          topic_id?: string
          total_questions?: number
          user_id?: string
          weak_subtopics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_exam_results_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_prerequisites: {
        Row: {
          created_at: string | null
          id: string
          is_strong_dependency: boolean | null
          prerequisite_topic_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_strong_dependency?: boolean | null
          prerequisite_topic_id: string
          topic_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_strong_dependency?: boolean | null
          prerequisite_topic_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_prerequisites_prerequisite_topic_id_fkey"
            columns: ["prerequisite_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_prerequisites_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      tutor_customization_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          description: string | null
          icon_key: string
          id: string
          is_premium: boolean
          name: string
          order_index: number
          rarity: Database["public"]["Enums"]["item_rarity"]
          unlock_requirement_type: Database["public"]["Enums"]["unlock_requirement_type"]
          unlock_requirement_value: number
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          description?: string | null
          icon_key: string
          id?: string
          is_premium?: boolean
          name: string
          order_index?: number
          rarity?: Database["public"]["Enums"]["item_rarity"]
          unlock_requirement_type: Database["public"]["Enums"]["unlock_requirement_type"]
          unlock_requirement_value: number
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          description?: string | null
          icon_key?: string
          id?: string
          is_premium?: boolean
          name?: string
          order_index?: number
          rarity?: Database["public"]["Enums"]["item_rarity"]
          unlock_requirement_type?: Database["public"]["Enums"]["unlock_requirement_type"]
          unlock_requirement_value?: number
        }
        Relationships: []
      }
      user_learning_goals: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          target_date: string
          topics_to_master: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          target_date: string
          topics_to_master?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          target_date?: string
          topics_to_master?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subtopic_progress: {
        Row: {
          consecutive_correct: number | null
          current_difficulty: string | null
          easy_mastered: boolean | null
          exam_ready: boolean | null
          exercises_completed: number
          exercises_correct: number
          hard_mastered: boolean | null
          hints_used: number
          id: string
          mastery_percentage: number
          medium_mastered: boolean | null
          subtopic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consecutive_correct?: number | null
          current_difficulty?: string | null
          easy_mastered?: boolean | null
          exam_ready?: boolean | null
          exercises_completed?: number
          exercises_correct?: number
          hard_mastered?: boolean | null
          hints_used?: number
          id?: string
          mastery_percentage?: number
          medium_mastered?: boolean | null
          subtopic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consecutive_correct?: number | null
          current_difficulty?: string | null
          easy_mastered?: boolean | null
          exam_ready?: boolean | null
          exercises_completed?: number
          exercises_correct?: number
          hard_mastered?: boolean | null
          hints_used?: number
          id?: string
          mastery_percentage?: number
          medium_mastered?: boolean | null
          subtopic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subtopic_progress_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          exercises_completed: number
          exercises_correct: number
          id: string
          mastery_percentage: number
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          exercises_completed?: number
          exercises_correct?: number
          id?: string
          mastery_percentage?: number
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          exercises_completed?: number
          exercises_correct?: number
          id?: string
          mastery_percentage?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tutor_preferences: {
        Row: {
          avatar_style: string | null
          chat_theme: string | null
          created_at: string | null
          equipped_accessory: string | null
          equipped_background: string | null
          equipped_effect: string | null
          equipped_outfit: string | null
          id: string
          personality: string | null
          tutor_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_style?: string | null
          chat_theme?: string | null
          created_at?: string | null
          equipped_accessory?: string | null
          equipped_background?: string | null
          equipped_effect?: string | null
          equipped_outfit?: string | null
          id?: string
          personality?: string | null
          tutor_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_style?: string | null
          chat_theme?: string | null
          created_at?: string | null
          equipped_accessory?: string | null
          equipped_background?: string | null
          equipped_effect?: string | null
          equipped_outfit?: string | null
          id?: string
          personality?: string | null
          tutor_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tutor_preferences_equipped_accessory_fkey"
            columns: ["equipped_accessory"]
            isOneToOne: false
            referencedRelation: "tutor_customization_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tutor_preferences_equipped_background_fkey"
            columns: ["equipped_background"]
            isOneToOne: false
            referencedRelation: "tutor_customization_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tutor_preferences_equipped_effect_fkey"
            columns: ["equipped_effect"]
            isOneToOne: false
            referencedRelation: "tutor_customization_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tutor_preferences_equipped_outfit_fkey"
            columns: ["equipped_outfit"]
            isOneToOne: false
            referencedRelation: "tutor_customization_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocked_items: {
        Row: {
          id: string
          is_equipped: boolean
          item_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          item_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          item_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocked_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "tutor_customization_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      diagnostic_questions_public: {
        Row: {
          created_at: string | null
          diagnostic_test_id: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          hints: Json | null
          id: string | null
          order_index: number | null
          question: string | null
          subtopic_id: string | null
        }
        Insert: {
          created_at?: string | null
          diagnostic_test_id?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: Json | null
          id?: string | null
          order_index?: number | null
          question?: string | null
          subtopic_id?: string | null
        }
        Update: {
          created_at?: string | null
          diagnostic_test_id?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: Json | null
          id?: string | null
          order_index?: number | null
          question?: string | null
          subtopic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_questions_diagnostic_test_id_fkey"
            columns: ["diagnostic_test_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_questions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises_public: {
        Row: {
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          hints: string[] | null
          id: string | null
          question: string | null
          subtopic_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: string[] | null
          id?: string | null
          question?: string | null
          subtopic_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: string[] | null
          id?: string | null
          question?: string | null
          subtopic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      diagnostic_status: "not_started" | "in_progress" | "completed"
      difficulty_level: "easy" | "medium" | "hard"
      item_category: "accessory" | "outfit" | "background" | "effect"
      item_rarity: "common" | "rare" | "epic" | "legendary"
      unlock_requirement_type:
        | "xp"
        | "streak"
        | "exercises"
        | "mastery"
        | "topic_complete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      diagnostic_status: ["not_started", "in_progress", "completed"],
      difficulty_level: ["easy", "medium", "hard"],
      item_category: ["accessory", "outfit", "background", "effect"],
      item_rarity: ["common", "rare", "epic", "legendary"],
      unlock_requirement_type: [
        "xp",
        "streak",
        "exercises",
        "mastery",
        "topic_complete",
      ],
    },
  },
} as const
