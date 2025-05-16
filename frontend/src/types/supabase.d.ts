declare module '@supabase/supabase-js' {
  export interface SupabaseClient<Database, SchemaName, Schema> {
    from<TableName extends string>(table: TableName): PostgrestFilterBuilder<any, any, null, TableName, unknown>;
    rpc<Params extends Record<string, unknown>>(
      fn: string,
      params?: Params,
      options?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }
    ): PostgrestFilterBuilder<any, any, null, any, unknown>;
    storage: {
      from(bucket: string): {
        upload(path: string, file: any, options?: any): Promise<{ data: any; error: any }>;
        getPublicUrl(path: string): { data: { publicUrl: string } };
      };
    };
    auth: {
      signUp(credentials: { email: string; password: string }): Promise<{ data: any; error: any }>;
      signIn(credentials: { email: string; password: string }): Promise<{ data: any; error: any }>;
      signOut(): Promise<{ error: any }>;
      onAuthStateChange(callback: (event: string, session: any) => void): { data: any; error: any };
      getSession(): Promise<{ data: { session: any }; error: any }>;
    };
    channel(name: string): RealtimeChannel;
    removeChannel(channel: RealtimeChannel): Promise<{ error: Error | null }>;
  }

  export interface PostgrestResponse<T = any> {
    data: T;
    error: any;
    count?: number;
    status: number;
    statusText: string;
  }

  export interface PostgrestBuilder {
    select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated', head?: boolean }): PostgrestFilterBuilder;
  }

  export interface PostgrestFilterBuilder<T, J, F, TableName, RelationName> {
    eq(column: string, value: any): this;
    neq(column: string, value: any): this;
    gt(column: string, value: any): this;
    gte(column: string, value: any): this;
    lt(column: string, value: any): this;
    lte(column: string, value: any): this;
    like(column: string, pattern: string): this;
    ilike(column: string, pattern: string): this;
    is(column: string, value: any): this;
    in(column: string, values: any[]): this;
    contains(column: string, value: any): this;
    containedBy(column: string, value: any): this;
    rangeLt(column: string, range: any): this;
    rangeGt(column: string, range: any): this;
    rangeGte(column: string, range: any): this;
    rangeLte(column: string, range: any): this;
    rangeAdjacent(column: string, range: any): this;
    overlaps(column: string, value: any): this;
    textSearch(column: string, query: string, options?: { config?: string }): this;
    filter(column: string, operator: string, value: any): this;
    not(column: string, operator: string, value: any): this;
    or(filters: string, options?: { foreignTable?: string }): this;
    limit(count: number): this;
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }): this;
    select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated', head?: boolean }): this;
    single(): Promise<{ data: any; error: any }>;
    maybeSingle(): Promise<{ data: any; error: any }>;
    insert(values: Record<string, any>[] | Record<string, any>, options?: { returning?: string }): this;
    update(values: Record<string, any>, options?: { returning?: string }): this;
    upsert(values: Record<string, any>[] | Record<string, any>, options?: { returning?: string; onConflict?: string }): this;
    delete(options?: { returning?: string }): this;
    onConflict(column: string): this;
    ignore(): Promise<{ data: any; error: any }>;
    then(onfulfilled?: ((value: { data: any; error: any; count?: number }) => any) | undefined | null, onrejected?: ((reason: any) => any) | undefined | null): Promise<any>;
  }

  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): SupabaseClient<any, 'public', any>;
}
