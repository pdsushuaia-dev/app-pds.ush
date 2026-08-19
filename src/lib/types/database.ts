/**
 * Tipos de la base de datos.
 *
 * Estos tipos están escritos a mano como punto de partida y coinciden con
 * `supabase/migrations/0001_init.sql`. Una vez que el proyecto Supabase esté
 * creado, se pueden regenerar automáticamente con:
 *
 *   npx supabase gen types typescript --project-id <ID> > src/lib/types/database.ts
 */

export type Role = "client" | "walker" | "admin" | "bather";
export type City = "ushuaia" | "rio_grande";

export type SubscriptionStatus = "active" | "paused" | "overdue" | "canceled";
export type AppointmentStatus =
  | "requested"
  | "scheduled"
  | "rejected"
  | "done"
  | "canceled";
export type WalkStatus = "in_progress" | "done" | "canceled";
export type PaymentStatus = "pending" | "paid" | "overdue" | "canceled";
export type TimeSlot = "09" | "11" | "13" | "15" | "17" | "19";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  city: City | null;
  photo_url: string | null;
  active: boolean;
  created_at: string;
}

export type Dog = {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  photo_url: string | null;
  pickup_address: string | null;
  notes: string | null;
  created_at: string;
}

export type Plan = {
  id: string;
  name: string;
  days_per_week: number | null; // null = plan personalizado (días a convenir)
  price: number | null; // null = precio a convenir
  active: boolean;
  created_at: string;
}

export type Subscription = {
  id: string;
  dog_id: string;
  plan_id: string | null;
  status: SubscriptionStatus;
  custom_price: number | null; // ARS; null = usa el precio del plan
  mp_preapproval_id: string | null; // id de la suscripción en MercadoPago
  mp_status: string | null; // pending | authorized | paused | cancelled
  start_date: string;
  created_at: string;
}

export type ScheduleRule = {
  id: string;
  subscription_id: string;
  weekday: number; // 0=domingo ... 6=sábado
  time_slot: TimeSlot | null;
  time_of_day: string | null; // legacy, sin uso (reemplazado por time_slot)
}

export type Appointment = {
  id: string;
  dog_id: string;
  walker_id: string | null;
  scheduled_at: string;
  time_slot: TimeSlot | null;
  status: AppointmentStatus;
  reminded_at: string | null;
  responded_at: string | null;
  created_at: string;
}

export type WalkMedia = {
  id: string;
  walk_id: string;
  storage_path: string;
  media_type: "photo" | "video";
  created_at: string;
}

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
}

export type Walk = {
  id: string;
  appointment_id: string | null;
  walker_id: string;
  dog_id: string;
  started_at: string | null;
  ended_at: string | null;
  distance_m: number | null;
  duration_s: number | null;
  status: WalkStatus;
  created_at: string;
}

export type WalkPosition = {
  id: number;
  walk_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
}

export type Review = {
  id: string;
  walk_id: string;
  dog_id: string;
  client_id: string;
  walker_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type Banner = {
  id: string;
  title: string;
  body: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  created_by: string | null;
}

export type Announcement = {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export type Payment = {
  id: string;
  subscription_id: string | null;
  amount: number | null;
  status: PaymentStatus;
  mp_payment_id: string | null;
  period: string | null; // 'YYYY-MM'
  method: string | null; // 'manual' por defecto
  paid_at: string | null;
  created_at: string;
}

export type WalkerInvite = {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export type BathStatus = "requested" | "confirmed" | "done" | "canceled";

export type BathAppointment = {
  id: string;
  dog_id: string;
  scheduled_at: string;
  status: BathStatus;
  notes: string | null;
  created_at: string;
}

export type WalkerAvailability = {
  id: string;
  walker_id: string;
  weekday: number; // 0=domingo ... 6=sábado
  start_time: string; // 'HH:MM[:SS]'
  end_time: string;
  created_at: string;
}

/**
 * Tipo `Database` compatible con @supabase/ssr.
 * Provisorio: reemplazar por los tipos generados cuando exista el proyecto.
 */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile>; Relationships: [] };
      dogs: { Row: Dog; Insert: Partial<Dog> & { owner_id: string; name: string }; Update: Partial<Dog>; Relationships: [] };
      plans: { Row: Plan; Insert: Partial<Plan> & { name: string }; Update: Partial<Plan>; Relationships: [] };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription> & { dog_id: string }; Update: Partial<Subscription>; Relationships: [] };
      schedule_rules: { Row: ScheduleRule; Insert: Partial<ScheduleRule> & { subscription_id: string; weekday: number }; Update: Partial<ScheduleRule>; Relationships: [] };
      appointments: { Row: Appointment; Insert: Partial<Appointment> & { dog_id: string; scheduled_at: string }; Update: Partial<Appointment>; Relationships: [] };
      walks: { Row: Walk; Insert: Partial<Walk> & { walker_id: string; dog_id: string }; Update: Partial<Walk>; Relationships: [] };
      walk_positions: { Row: WalkPosition; Insert: Partial<WalkPosition> & { walk_id: string; lat: number; lng: number }; Update: Partial<WalkPosition>; Relationships: [] };
      reviews: { Row: Review; Insert: Partial<Review> & { walk_id: string; dog_id: string; client_id: string; rating: number }; Update: Partial<Review>; Relationships: [] };
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement>; Relationships: [] };
      banners: { Row: Banner; Insert: Partial<Banner> & { title: string }; Update: Partial<Banner>; Relationships: [] };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment>; Relationships: [] };
      walker_invites: { Row: WalkerInvite; Insert: Partial<WalkerInvite> & { code: string }; Update: Partial<WalkerInvite>; Relationships: [] };
      push_subscriptions: { Row: PushSubscriptionRow; Insert: Partial<PushSubscriptionRow> & { user_id: string; endpoint: string; p256dh: string; auth: string }; Update: Partial<PushSubscriptionRow>; Relationships: [] };
      walk_media: { Row: WalkMedia; Insert: Partial<WalkMedia> & { walk_id: string; storage_path: string; media_type: "photo" | "video" }; Update: Partial<WalkMedia>; Relationships: [] };
      bath_appointments: { Row: BathAppointment; Insert: Partial<BathAppointment> & { dog_id: string; scheduled_at: string }; Update: Partial<BathAppointment>; Relationships: [] };
      walker_availability: { Row: WalkerAvailability; Insert: Partial<WalkerAvailability> & { walker_id: string; weekday: number; start_time: string; end_time: string }; Update: Partial<WalkerAvailability>; Relationships: [] };
    };
    Views: {
      public_walkers: {
        Row: { id: string; full_name: string | null; photo_url: string | null };
        Relationships: [];
      };
    };
    Functions: {
      user_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      redeem_walker_invite: { Args: { invite_code: string }; Returns: string };
      admin_set_subscription_price: {
        Args: { p_subscription_id: string; p_price: number | null };
        Returns: undefined;
      };
      client_walk_history: {
        Args: { p_limit: number };
        Returns: {
          walk_id: string;
          dog_name: string;
          walker_name: string | null;
          ended_at: string | null;
          started_at: string | null;
          distance_m: number | null;
          duration_s: number | null;
          media_count: number;
        }[];
      };
      available_walkers: {
        Args: {
          p_scheduled_at: string;
          p_weekday: number;
          p_slot_start: string;
          p_slot_end: string;
        };
        Returns: { id: string; full_name: string | null; photo_url: string | null }[];
      };
    };
    Enums: Record<string, never>;
  };
}
