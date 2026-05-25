import {
  AccessContext,
  AccessControlConfig,
  AccessMode,
  AccessResult,
  AccessRule,
  ConfigurationSummary,
  ValidationResult,
} from "./types";

export class AccessEvaluator {
  private config: AccessControlConfig;

  constructor(config: AccessControlConfig) {
    this.config = config;
  }

  /**
   * Evaluates access based on the current configuration and context
   */
  evaluateAccess(context: AccessContext): AccessResult {
    const evaluationPath: string[] = [];
    const appliedRules: AccessRule[] = [];
    const startTime = Date.now();

    // Step 1: Evaluate company access
    const companyResult = this.evaluateCompanyAccess(
      context.companyId,
      evaluationPath,
      appliedRules
    );
    if (!companyResult.allowed) {
      return {
        allowed: false,
        reason: `Acceso denegado a la empresa: ${companyResult.reason}`,
        appliedRules: appliedRules,
        evaluationPath: evaluationPath,
        timestamp: new Date(),
        evaluationTime: Date.now() - startTime,
      };
    }

    // Step 2: Evaluate structure access (if enabled and context has structure levels)
    if (
      this.config.structure.enabled &&
      context.structureLevels &&
      context.structureLevels.length > 0
    ) {
      const structureResult = this.evaluateStructureAccess(
        context.structureLevels,
        evaluationPath,
        appliedRules
      );
      if (!structureResult.allowed) {
        return {
          allowed: false,
          reason: `Acceso denegado en la estructura organizacional: ${structureResult.reason}`,
          appliedRules: appliedRules,
          evaluationPath: evaluationPath,
          timestamp: new Date(),
          evaluationTime: Date.now() - startTime,
        };
      }
    }

    // Step 3: Evaluate branch access (if context has branch)
    if (context.branchId) {
      const branchResult = this.evaluateBranchAccess(
        context.branchId,
        evaluationPath,
        appliedRules
      );
      if (!branchResult.allowed) {
        return {
          allowed: false,
          reason: `Acceso denegado a la sucursal: ${branchResult.reason}`,
          appliedRules: appliedRules,
          evaluationPath: evaluationPath,
          timestamp: new Date(),
          evaluationTime: Date.now() - startTime,
        };
      }
    }

    return {
      allowed: true,
      reason: "Acceso permitido por todas las reglas",
      appliedRules: appliedRules,
      evaluationPath: evaluationPath,
      timestamp: new Date(),
      evaluationTime: Date.now() - startTime,
    };
  }

  /**
   * Evaluates company access based on whitelist/blacklist rules
   */
  private evaluateCompanyAccess(
    companyId: string,
    evaluationPath: string[],
    appliedRules: AccessRule[]
  ): { allowed: boolean; reason: string } {
    evaluationPath.push(`Evaluando acceso a empresa: ${companyId}`);

    // If no company restrictions, allow access
    if (this.config.companies.mode === AccessMode.NONE) {
      evaluationPath.push("Sin restricciones de empresa");
      return { allowed: true, reason: "Sin restricciones de empresa" };
    }

    const companyRule = this.config.companies.rules.find(
      (r) => r.targetId === companyId
    );

    if (this.config.companies.mode === AccessMode.WHITELIST) {
      if (companyRule && companyRule.type === "allow") {
        evaluationPath.push(`Empresa ${companyId} en lista blanca`);
        appliedRules.push(companyRule);
        return { allowed: true, reason: "Empresa en lista blanca" };
      } else {
        evaluationPath.push(`Empresa ${companyId} no está en lista blanca`);
        return { allowed: false, reason: "Empresa no está en lista blanca" };
      }
    } else if (this.config.companies.mode === AccessMode.BLACKLIST) {
      if (companyRule && companyRule.type === "deny") {
        evaluationPath.push(`Empresa ${companyId} en lista negra`);
        appliedRules.push(companyRule);
        return { allowed: false, reason: "Empresa en lista negra" };
      } else {
        evaluationPath.push(`Empresa ${companyId} no está en lista negra`);
        return { allowed: true, reason: "Empresa no está en lista negra" };
      }
    }

    return { allowed: true, reason: "Sin reglas específicas para empresa" };
  }

  /**
   * Evaluates structure access based on hierarchical levels
   */
  private evaluateStructureAccess(
    structureLevels: string[],
    evaluationPath: string[],
    appliedRules: AccessRule[]
  ): { allowed: boolean; reason: string } {
    evaluationPath.push(
      `Evaluando acceso a estructura: ${structureLevels.join(" -> ")}`
    );

    if (!this.config.structure.enabled) {
      evaluationPath.push("Control de estructura deshabilitado");
      return { allowed: true, reason: "Control de estructura deshabilitado" };
    }

    // Check if any level in the path is explicitly denied
    for (const levelId of structureLevels) {
      const denyRule = this.config.structure.rules.find(
        (r) => r.targetId === levelId && r.type === "deny"
      );
      if (denyRule) {
        evaluationPath.push(`Nivel ${levelId} explícitamente denegado`);
        appliedRules.push(denyRule);
        return {
          allowed: false,
          reason: `Nivel ${levelId} explícitamente denegado`,
        };
      }
    }

    // Check if any level in the path is explicitly allowed
    for (const levelId of structureLevels) {
      const allowRule = this.config.structure.rules.find(
        (r) => r.targetId === levelId && r.type === "allow"
      );
      if (allowRule) {
        evaluationPath.push(`Nivel ${levelId} explícitamente permitido`);
        appliedRules.push(allowRule);
        return {
          allowed: true,
          reason: `Nivel ${levelId} explícitamente permitido`,
        };
      }
    }

    // If no explicit rules, check if there are any structure rules at all
    if (this.config.structure.rules.length > 0) {
      evaluationPath.push(
        "Ningún nivel en la ruta está explícitamente permitido"
      );
      return {
        allowed: false,
        reason: "Ningún nivel en la ruta está explícitamente permitido",
      };
    }

    evaluationPath.push("Sin reglas específicas de estructura");
    return { allowed: true, reason: "Sin reglas específicas de estructura" };
  }

  /**
   * Evaluates branch access based on whitelist/blacklist rules
   */
  private evaluateBranchAccess(
    branchId: string,
    evaluationPath: string[],
    appliedRules: AccessRule[]
  ): { allowed: boolean; reason: string } {
    evaluationPath.push(`Evaluando acceso a sucursal: ${branchId}`);

    // If no branch restrictions, allow access
    if (this.config.branches.mode === AccessMode.NONE) {
      evaluationPath.push("Sin restricciones de sucursal");
      return { allowed: true, reason: "Sin restricciones de sucursal" };
    }

    const branchRule = this.config.branches.rules.find(
      (r) => r.targetId === branchId
    );

    if (this.config.branches.mode === AccessMode.WHITELIST) {
      if (branchRule && branchRule.type === "allow") {
        evaluationPath.push(`Sucursal ${branchId} en lista blanca`);
        appliedRules.push(branchRule);
        return { allowed: true, reason: "Sucursal en lista blanca" };
      } else {
        evaluationPath.push(`Sucursal ${branchId} no está en lista blanca`);
        return { allowed: false, reason: "Sucursal no está en lista blanca" };
      }
    } else if (this.config.branches.mode === AccessMode.BLACKLIST) {
      if (branchRule && branchRule.type === "deny") {
        evaluationPath.push(`Sucursal ${branchId} en lista negra`);
        appliedRules.push(branchRule);
        return { allowed: false, reason: "Sucursal en lista negra" };
      } else {
        evaluationPath.push(`Sucursal ${branchId} no está en lista negra`);
        return { allowed: true, reason: "Sucursal no está en lista negra" };
      }
    }

    return { allowed: true, reason: "Sin reglas específicas para sucursal" };
  }

  /**
   * Validates the configuration for logical consistency
   */
  validateConfiguration(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for conflicting company rules
    const hasAllowCompanies = this.config.companies.rules.some(
      (r) => r.type === "allow"
    );
    const hasDenyCompanies = this.config.companies.rules.some(
      (r) => r.type === "deny"
    );

    if (hasAllowCompanies && hasDenyCompanies) {
      errors.push(
        "No se pueden tener empresas permitidas y denegadas al mismo tiempo"
      );
    }

    // Check for conflicting branch rules
    const hasAllowBranches = this.config.branches.rules.some(
      (r) => r.type === "allow"
    );
    const hasDenyBranches = this.config.branches.rules.some(
      (r) => r.type === "deny"
    );

    if (hasAllowBranches && hasDenyBranches) {
      errors.push(
        "No se pueden tener sucursales permitidas y denegadas al mismo tiempo"
      );
    }

    // Check for conflicting structure rules (same level with both allow and deny)
    const structureLevels = new Set(
      this.config.structure.rules.map((r) => r.targetId)
    );
    for (const levelId of structureLevels) {
      const allowRule = this.config.structure.rules.find(
        (r) => r.targetId === levelId && r.type === "allow"
      );
      const denyRule = this.config.structure.rules.find(
        (r) => r.targetId === levelId && r.type === "deny"
      );

      if (allowRule && denyRule) {
        errors.push(
          `Nivel de estructura ${levelId} tiene reglas contradictorias (permitir y denegar)`
        );
      }
    }

    // Add warnings for potential issues
    if (
      this.config.companies.rules.length === 0 &&
      this.config.companies.mode !== AccessMode.NONE
    ) {
      warnings.push("Modo de empresa configurado pero sin reglas definidas");
    }

    if (
      this.config.branches.rules.length === 0 &&
      this.config.branches.mode !== AccessMode.NONE
    ) {
      warnings.push("Modo de sucursal configurado pero sin reglas definidas");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  /**
   * Gets a summary of the current configuration
   */
  getConfigurationSummary(): ConfigurationSummary {
    const totalRules =
      this.config.companies.rules.length +
      this.config.structure.rules.length +
      this.config.branches.rules.length;

    const complexity =
      totalRules <= 5 ? "low" : totalRules <= 15 ? "medium" : "high";

    return {
      companies: {
        mode: this.config.companies.mode,
        count: this.config.companies.rules.length,
        description: this.getCompanyDescription(),
      },
      structure: {
        enabled: this.config.structure.enabled,
        levels: this.config.structure.rules.length,
        description: this.getStructureDescription(),
      },
      branches: {
        mode: this.config.branches.mode,
        count: this.config.branches.rules.length,
        description: this.getBranchDescription(),
      },
      general: {
        totalRules,
        lastModified: new Date(),
        complexity,
      },
    };
  }

  private getCompanyDescription(): string {
    if (this.config.companies.mode === AccessMode.NONE)
      return "Sin restricciones de empresa";
    if (this.config.companies.mode === AccessMode.WHITELIST) {
      const count = this.config.companies.rules.filter(
        (r) => r.type === "allow"
      ).length;
      return `${count} empresa(s) permitida(s)`;
    }
    const count = this.config.companies.rules.filter(
      (r) => r.type === "deny"
    ).length;
    return `${count} empresa(s) denegada(s)`;
  }

  private getStructureDescription(): string {
    if (!this.config.structure.enabled) return "Control deshabilitado";
    const count = this.config.structure.rules.length;
    return `${count} nivel(es) configurado(s)`;
  }

  private getBranchDescription(): string {
    if (this.config.branches.mode === AccessMode.NONE)
      return "Sin restricciones de sucursal";
    if (this.config.branches.mode === AccessMode.WHITELIST) {
      const count = this.config.branches.rules.filter(
        (r) => r.type === "allow"
      ).length;
      return `${count} sucursal(es) permitida(s)`;
    }
    const count = this.config.branches.rules.filter(
      (r) => r.type === "deny"
    ).length;
    return `${count} sucursal(es) denegada(s)`;
  }

  /**
   * Updates the configuration
   */
  updateConfiguration(newConfig: AccessControlConfig): void {
    this.config = newConfig;
  }

  /**
   * Gets the current configuration
   */
  getConfiguration(): AccessControlConfig {
    return this.config;
  }
}

/**
 * Utility function to create a new AccessEvaluator instance
 */
export function createAccessEvaluator(
  config: AccessControlConfig
): AccessEvaluator {
  return new AccessEvaluator(config);
}

/**
 * Utility function to evaluate access with a simple interface
 */
export function evaluateAccess(
  config: AccessControlConfig,
  context: AccessContext
): AccessResult {
  const evaluator = new AccessEvaluator(config);
  return evaluator.evaluateAccess(context);
}
