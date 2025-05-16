/**
 * Agent Registry for managing and coordinating the agent ecosystem
 * 
 * This module provides a central registry for all agents in the system,
 * allowing for service discovery, event coordination, and management.
 */
import { logger } from '@/lib/utils/logger';

/**
 * Agent interface defining the required properties and methods for all agents
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  handleRequest: (input: any) => Promise<any>;
  isAvailable: () => Promise<boolean>;
}

/**
 * Agent Registry singleton class
 */
class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private events: Map<string, Set<(data: any) => void>> = new Map();
  
  /**
   * Register a new agent with the registry
   * @param agent - The agent to register
   * @returns Boolean indicating if registration was successful
   */
  public registerAgent(agent: Agent): boolean {
    try {
      if (!agent.id || !agent.name || !agent.handleRequest) {
        logger.error('Invalid agent registration', { 
          agentId: agent.id, 
          agentName: agent.name 
        });
        return false;
      }
      
      if (this.agents.has(agent.id)) {
        logger.warn('Agent with this ID already registered', { agentId: agent.id });
        return false;
      }
      
      this.agents.set(agent.id, agent);
      logger.info('Agent registered successfully', { 
        agentId: agent.id, 
        agentName: agent.name 
      });
      
      return true;
    } catch (error) {
      logger.error('Error registering agent', { error, agentId: agent.id });
      return false;
    }
  }
  
  /**
   * Unregister an agent from the registry
   * @param agentId - The ID of the agent to unregister
   * @returns Boolean indicating if unregistration was successful
   */
  public unregisterAgent(agentId: string): boolean {
    try {
      if (!this.agents.has(agentId)) {
        logger.warn('Agent not found for unregistration', { agentId });
        return false;
      }
      
      this.agents.delete(agentId);
      logger.info('Agent unregistered successfully', { agentId });
      
      return true;
    } catch (error) {
      logger.error('Error unregistering agent', { error, agentId });
      return false;
    }
  }
  
  /**
   * Get an agent by ID
   * @param agentId - The ID of the agent to get
   * @returns The agent, or undefined if not found
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all registered agents
   * @returns Array of all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by capability
   * @param capability - The capability to filter by
   * @returns Array of agents with the specified capability
   */
  public getAgentsByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.includes(capability)
    );
  }
  
  /**
   * Send a request to an agent and get the response
   * @param agentId - The ID of the agent to send the request to
   * @param request - The request to send
   * @returns Promise resolving to the agent's response
   */
  public async sendRequest(agentId: string, request: any): Promise<any> {
    try {
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      const isAvailable = await agent.isAvailable();
      
      if (!isAvailable) {
        throw new Error(`Agent not available: ${agentId}`);
      }
      
      logger.info('Sending request to agent', { 
        agentId, 
        requestType: request.type || 'unknown' 
      });
      
      const response = await agent.handleRequest(request);
      
      logger.info('Received response from agent', { 
        agentId, 
        responseStatus: response.status || 'unknown' 
      });
      
      return response;
    } catch (error) {
      logger.error('Error sending request to agent', { error, agentId });
      throw error;
    }
  }
  
  /**
   * Subscribe to an event
   * @param eventType - The type of event to subscribe to
   * @param callback - The callback to invoke when the event occurs
   */
  public subscribe(eventType: string, callback: (data: any) => void): void {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, new Set());
    }
    
    this.events.get(eventType)!.add(callback);
  }
  
  /**
   * Unsubscribe from an event
   * @param eventType - The type of event to unsubscribe from
   * @param callback - The callback to remove
   */
  public unsubscribe(eventType: string, callback: (data: any) => void): void {
    if (!this.events.has(eventType)) {
      return;
    }
    
    this.events.get(eventType)!.delete(callback);
  }
  
  /**
   * Publish an event
   * @param eventType - The type of event to publish
   * @param data - The data to include with the event
   */
  public publish(eventType: string, data: any): void {
    if (!this.events.has(eventType)) {
      return;
    }
    
    logger.debug('Publishing event', { eventType });
    
    for (const callback of this.events.get(eventType)!) {
      try {
        callback(data);
      } catch (error) {
        logger.error('Error in event callback', { error, eventType });
      }
    }
  }
}

// Export a singleton instance
export const agentRegistry = new AgentRegistry();

// Export a function to create and register a new agent
export function createAgent(
  id: string,
  name: string,
  description: string,
  capabilities: string[],
  handleRequest: (input: any) => Promise<any>,
  isAvailable: () => Promise<boolean> = async () => true
): Agent {
  const agent: Agent = {
    id,
    name,
    description,
    capabilities,
    handleRequest,
    isAvailable
  };
  
  agentRegistry.registerAgent(agent);
  
  return agent;
}
