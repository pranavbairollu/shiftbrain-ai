-- PostgreSQL Database Schema for ShiftBrain AI (MVP Version)
-- Optimized for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS PROFILE TABLE (extending Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    profession VARCHAR(100) NOT NULL,
    chronotype VARCHAR(50) DEFAULT 'neutral', -- morning_lark, night_owl, neutral
    sleep_goal_mins INT DEFAULT 480, -- 8 hours baseline
    whatsapp_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp_number);

-- 2. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_name VARCHAR(100), -- e.g., 'Night Shift', 'Day Shift'
    source VARCHAR(50) DEFAULT 'manual', -- manual, ocr_screenshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shifts_user_time ON public.shifts(user_id, start_time, end_time);

-- 3. SLEEP LOGS TABLE
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sleep_end TIMESTAMP WITH TIME ZONE NOT NULL,
    quality_score INT CHECK (quality_score >= 1 AND quality_score <= 100),
    source VARCHAR(50) DEFAULT 'manual', -- manual, automatic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_start ON public.sleep_logs(user_id, sleep_start);

-- 4. ENERGY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.energy_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    log_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subjective_energy INT CHECK (subjective_energy >= 1 AND subjective_energy <= 10),
    cognitive_fatigue INT CHECK (cognitive_fatigue >= 1 AND cognitive_fatigue <= 10),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_energy_logs_user_time ON public.energy_logs(user_id, log_time);

-- 5. SURVIVAL PLANS TABLE (The Core Recommendations)
CREATE TABLE IF NOT EXISTS public.survival_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_date DATE NOT NULL,
    
    -- Sleep recommendations
    sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sleep_end TIMESTAMP WITH TIME ZONE NOT NULL,
    sleep_tips TEXT,
    
    -- Caffeine cutoff recommendation
    caffeine_cutoff TIMESTAMP WITH TIME ZONE NOT NULL,
    caffeine_tips TEXT,
    
    -- Upskilling window recommendation
    focus_start TIMESTAMP WITH TIME ZONE,
    focus_end TIMESTAMP WITH TIME ZONE,
    focus_topic VARCHAR(255) DEFAULT 'Software Development',
    
    -- Light exposure tips
    blue_blocker_start TIMESTAMP WITH TIME ZONE,
    blue_blocker_end TIMESTAMP WITH TIME ZONE,
    light_exposure_start TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure user has only one survival plan per date
    UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_survival_plans_user_date ON public.survival_plans(user_id, plan_date);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survival_plans_updated_at
    BEFORE UPDATE ON public.survival_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
