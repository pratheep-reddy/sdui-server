import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../templates/entities/template.entity';
import { DynamicSetting } from '../templates/entities/dynamic-setting.entity';

@Injectable()
export class SduiService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(DynamicSetting)
    private dynamicSettingRepository: Repository<DynamicSetting>,
  ) {}

  async getSduiComponent(templateId: string): Promise<any> {
    console.log('=== getSduiComponent called ===');
    console.log('templateId:', templateId);
    
    const template = await this.templateRepository.findOne({
      where: { templateId },
      relations: ['dynamicSetting'],
    });

    console.log('Template found:', template ? 'Yes' : 'No');
    
    if (!template) {
      throw new NotFoundException(`Template with templateId "${templateId}" not found`);
    }
    
    console.log('Template type:', template.templateType);
    console.log('Template id (UUID):', template.id);

    // Use the dynamicSetting from the loaded relation
    const dynamicSetting = template.dynamicSetting;

    console.log('=== Dynamic Setting Status ===');
    console.log('dynamicSetting exists:', !!dynamicSetting);
    if (dynamicSetting) {
      console.log('Endpoint:', dynamicSetting.endpoint);
      console.log('HTTP Method:', dynamicSetting.httpMethod);
      console.log('Request JSON:', JSON.stringify(dynamicSetting.requestJson));
    }

    if (!dynamicSetting) {
      console.log('❌ No dynamic setting found for template', templateId);
      console.log('Returning static template');
      return {
        success: true,
        data: template.staticTemplateJson,
      };
    }

    try {
      const { endpoint, httpMethod, requestJson, headerJson } = dynamicSetting;
      
      console.log('=== Making API Call ===');
      console.log('Endpoint:', endpoint);
      console.log('Method:', httpMethod);
      console.log('Request Body:', JSON.stringify(requestJson, null, 2));
      
      let apiResponse: Response;

      if (httpMethod === 'GET') {
        apiResponse = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            ...headerJson,
          },
        });
      } else {
        apiResponse = await fetch(endpoint, {
          method: httpMethod,
          headers: {
            'Content-Type': 'application/json',
            ...headerJson,
          },
          body: JSON.stringify(requestJson || {}),
        });
      } 

      console.log('API Response Status:', apiResponse.status, apiResponse.statusText);

      if (!apiResponse.ok) {
        console.error(`❌ API call failed: ${apiResponse.status} ${apiResponse.statusText}`);
        console.error('Returning static template as fallback');
        return {
          success: true,
          data: template.staticTemplateJson,
        };
      }

      const apiData = await apiResponse.json();
      console.log('=== API Response Data ===');
      console.log(JSON.stringify(apiData, null, 2));

    // Use dynamicTemplateJson if it exists (has field mappings), otherwise use staticTemplateJson
    const sourceTemplate = template.dynamicTemplateJson || template.staticTemplateJson;
    console.log(`Using ${template.dynamicTemplateJson ? 'dynamicTemplateJson' : 'staticTemplateJson'} as template source`);
    
    // Deep clone template data
    const mergedData = JSON.parse(JSON.stringify(sourceTemplate));

      console.log('=== Merging Variables ===');
      console.log('Template structure check:');
      console.log('- Has card.variables:', !!mergedData.card?.variables);
      console.log('- Has root variables:', !!mergedData.variables);
      console.log('- Has template.variables:', !!mergedData.template?.variables);

      // Merge the API data with template variables
      // DivKit can have variables at different locations
      let variablesMerged = false;
      
      if (mergedData.card?.variables) {
        // Variables under card (most common)
        console.log('✓ Merging card.variables (count:', mergedData.card.variables.length, ')');
        console.log('Full variables array:', JSON.stringify(mergedData.card.variables, null, 2));
        mergedData.card.variables = mergedData.card.variables.map((variable: any, index: number) => {
          console.log(`\n  ====== Variable [${index}] ======`);
          console.log(`  Name: ${variable.name}`);
          console.log(`  Type: ${variable.type}`);
          console.log(`  arrayKeyName: ${variable.arrayKeyName || 'none'}`);
          console.log(`  Value preview:`, JSON.stringify(variable.value).substring(0, 100));
          
          const merged = this.mergeVariable(variable, apiData);
          
          console.log(`  Merged value preview:`, JSON.stringify(merged.value).substring(0, 200));
          return merged;
        });
        variablesMerged = true;
      } else if (mergedData.variables) {
        // Variables at root level
        console.log('✓ Merging root variables (count:', mergedData.variables.length, ')');
        mergedData.variables = mergedData.variables.map((variable: any, index: number) => {
          console.log(`  - Variable [${index}]:`, variable.name, '(type:', variable.type, ')');
          const merged = this.mergeVariable(variable, apiData);
          console.log(`    Merged value:`, JSON.stringify(merged.value).substring(0, 200));
          return merged;
        });
        variablesMerged = true;
      } else if (mergedData.template?.variables) {
        // Variables under template
        console.log('✓ Merging template.variables (count:', mergedData.template.variables.length, ')');
        mergedData.template.variables = mergedData.template.variables.map((variable: any, index: number) => {
          console.log(`  - Variable [${index}]:`, variable.name, '(type:', variable.type, ')');
          const merged = this.mergeVariable(variable, apiData);
          console.log(`    Merged value:`, JSON.stringify(merged.value).substring(0, 200));
          return merged;
        });
        variablesMerged = true;
      } else {
        console.log('⚠️ No variables found in template to merge!');
      }

      console.log('=== Merge Complete ===');
      console.log('Variables merged:', variablesMerged);

      // Note: We keep variable.name unchanged and preserve arrayKeyName as metadata
      // The template structure references the original variable.name, so we must not change it

      // DO NOT save mergedData back to database - it contains actual values, not placeholders!
      // dynamicTemplateJson should only be updated via the UI with placeholders and metadata
      console.log('✓ Merge complete (not saving to database - keeping original template structure)');

      return {
        success: true,
        data: mergedData,
      };
    } catch (error) {
      console.error('❌ Error in getSduiComponent:', error);
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
      console.error('Returning static template as fallback');
      return {
        success: true,
        data: template.staticTemplateJson,
      };
    }
  }

  /**
   * Merge a single variable with API data based on its type
   */
  private mergeVariable(variable: any, apiData: any): any {
    if (!variable || !variable.type) {
      return variable;
    }

    switch (variable.type) {
      case 'array':
        return this.mergeArrayVariable(variable, apiData);
      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        return this.mergePrimitiveVariable(variable, apiData);
      case 'dict':
      case 'object':
        return this.mergeObjectVariable(variable, apiData);
      default:
        return variable;
    }
  }

  /**
   * Handle array type variables
   */
  private mergeArrayVariable(variable: any, apiData: any): any {
    console.log(`  [mergeArrayVariable] Processing array variable: "${variable.name}"`);
    if (variable.arrayKeyName) {
      console.log(`  [mergeArrayVariable] Has arrayKeyName: "${variable.arrayKeyName}"`);
    }
    
    if (!Array.isArray(variable.value) || variable.value.length === 0) {
      console.log(`  [mergeArrayVariable] ❌ Variable value is not an array or is empty`);
      return variable;
    }

    // Use arrayKeyName if available, otherwise use variable.name
    const lookupKey = variable.arrayKeyName || variable.name;
    console.log(`  [mergeArrayVariable] Looking up data using key: "${lookupKey}"`);

    // First: Check if lookupKey exists directly in apiData
    let arrayData = apiData[lookupKey];
    console.log(`  [mergeArrayVariable] Direct key check (${lookupKey}):`, arrayData ? 'Found' : 'Not found');

    // Second: Try nested path if not found directly
    if (!arrayData) {
      arrayData = this.resolveNestedPath(apiData, lookupKey);
      console.log(`  [mergeArrayVariable] Nested path check:`, arrayData ? 'Found' : 'Not found');
    }

    // Third: Try common patterns as fallback
    if (!arrayData || !Array.isArray(arrayData)) {
      console.log(`  [mergeArrayVariable] Trying fallback patterns...`);
      arrayData = this.findArrayInResponse(apiData, lookupKey);
    }

    if (!arrayData || !Array.isArray(arrayData)) {
      console.log(`  [mergeArrayVariable] ❌ No array data found for "${variable.name}"`);
      return variable;
    }

    console.log(`  [mergeArrayVariable] ✓ Found array data with ${arrayData.length} items`);
    
    // Take the first element from template as the template
    const itemTemplate = variable.value[0];
    console.log(`  [mergeArrayVariable] Item template:`, JSON.stringify(itemTemplate).substring(0, 200));

    // Map each item in the API array using the template
    // Each apiItem is merged with the template independently
    // Pass the lookupKey (arrayKeyName or variable.name) so we can strip it from placeholder paths
    console.log(`  [mergeArrayVariable] 🔄 Starting to map ${arrayData.length} items...`);
    const mappedArray = arrayData.map((apiItem, index) => {
      console.log(`\n  [mergeArrayVariable] 📦 Processing API item #${index}:`);
      console.log(`    Item data:`, JSON.stringify(apiItem).substring(0, 200));
      console.log(`    lookupKey: "${lookupKey}"`);
      
      // IMPORTANT: Deep clone the template for each item to avoid mutation!
      const freshTemplate = JSON.parse(JSON.stringify(itemTemplate));
      const mapped = this.mapTemplateRecursively(freshTemplate, apiItem, 0, lookupKey);
      
      // Post-process: convert descriptions string to array if needed
      if (mapped.descriptions && typeof mapped.descriptions === 'string') {
        // Split by newlines and create array of text objects
        const lines = mapped.descriptions.split('\n').filter(line => line.trim());
        mapped.descriptions = lines.map(line => ({ text: line.trim() }));
      }
      
      console.log(`    ✅ Mapped result:`, JSON.stringify(mapped).substring(0, 300));
      return mapped;
    });

    console.log(`  [mergeArrayVariable] ✓ Successfully mapped ${mappedArray.length} items`);

    return {
      ...variable,
      value: mappedArray,
    };
  }

  /**
   * Map array items recursively using the template
   */
  private mapArrayItems(itemTemplate: any, arrayData: any[]): any[] {
    return arrayData.map((dataItem) => {
      return this.mapTemplateRecursively(itemTemplate, dataItem);
    });
  }

  /**
   * Recursively map template values with data
   * For each placeholder like {{field}} or {{nested.field}}, trace the path within dataItem
   */
  private mapTemplateRecursively(template: any, dataItem: any, depth: number = 0, arrayVarName?: string): any {
    if (template === null || template === undefined) {
      return template;
    }

    // Handle primitive types
    if (typeof template === 'string') {
      // Check if it's a placeholder like {{response.data.field}} or {{field}}
      if (template.includes('{{') && template.includes('}}')) {
        const originalPath = this.extractPathFromMapping(template);
        let path = originalPath;
        
        // If we're inside an array item mapping and the path starts with the array variable name,
        // remove it to get the relative path within the item
        if (arrayVarName && path.startsWith(arrayVarName + '.')) {
          const strippedPath = path.substring(arrayVarName.length + 1);
          console.log(`    [mapTemplate] ✂️ Stripping "${arrayVarName}." from "${path}" → "${strippedPath}"`);
          path = strippedPath;
        } else if (arrayVarName) {
          console.log(`    [mapTemplate] ⚠️ Path "${path}" does NOT start with "${arrayVarName}." - not stripping`);
        }
        
        const value = this.resolveNestedPath(dataItem, path);
        
        const dataItemPreview = JSON.stringify(dataItem).substring(0, 200);
        console.log(`    [mapTemplate] "${template}"`);
        console.log(`      → Path: "${originalPath}" → "${path}"`);
        console.log(`      → DataItem: ${dataItemPreview}`);
        console.log(`      → Resolved Value:`, value !== undefined ? JSON.stringify(value).substring(0, 100) : '❌ NOT FOUND');
        
        return value !== undefined ? value : template;
      }
      return template;
    }

    if (typeof template === 'number' || typeof template === 'boolean') {
      return template;
    }

    // Handle arrays
    if (Array.isArray(template)) {
      return template.map((item) => this.mapTemplateRecursively(item, dataItem, depth + 1, arrayVarName));
    }

    // Handle objects
    if (typeof template === 'object') {
      const result: any = {};
      for (const key in template) {
        if (template.hasOwnProperty(key)) {
          result[key] = this.mapTemplateRecursively(template[key], dataItem, depth + 1, arrayVarName);
        }
      }
      return result;
    }

    return template;
  }

  /**
   * Handle primitive type variables (string, number, boolean, integer)
   */
  private mergePrimitiveVariable(variable: any, apiData: any): any {
    console.log(`  [mergePrimitiveVariable] Processing "${variable.name}" (type: ${variable.type})`);
    console.log(`  [mergePrimitiveVariable] Current value:`, variable.value);
    
    // For primitives, extract path from placeholder like {{response.data.field}}
    if (typeof variable.value === 'string' && variable.value.includes('{{') && variable.value.includes('}}')) {
      const path = this.extractPathFromMapping(variable.value);
      console.log(`  [mergePrimitiveVariable] Extracting from placeholder path: ${path}`);
      const value = this.resolveNestedPath(apiData, path);
      if (value !== undefined) {
        console.log(`  [mergePrimitiveVariable] ✓ Resolved value:`, value);
        return {
          ...variable,
          value: value,
        };
      } else {
        console.log(`  [mergePrimitiveVariable] ❌ Could not resolve path: ${path}`);
      }
    } else {
      console.log(`  [mergePrimitiveVariable] ⚠️ No placeholder found in value, keeping original`);
    }

    return variable;
  }
          
  /**
   * Handle object/dict type variables
   */
  private mergeObjectVariable(variable: any, apiData: any): any {
    console.log(`  [mergeObjectVariable] Processing object variable: "${variable.name}"`);
    
    if (typeof variable.value !== 'object' || variable.value === null) {
      console.log(`  [mergeObjectVariable] ❌ Variable value is not an object`);
      return variable;
    }

    console.log(`  [mergeObjectVariable] Recursively mapping template with API data`);
    // For objects, recursively map the template structure with API data
    // The placeholders inside the object will be resolved
    const mergedValue = this.mapTemplateRecursively(variable.value, apiData);
    
    console.log(`  [mergeObjectVariable] ✓ Object merged`);
    return {
      ...variable,
      value: mergedValue,
    };
  }

  /**
   * Find array in response using common patterns
   */
  private findArrayInResponse(apiData: any, variableName: string): any[] | null {
    const possiblePaths = [
      variableName,
      `data.${variableName}`,
      `response.${variableName}`,
      variableName.replace(/_/g, ''),
      'data',
      'items',
      'results',
    ];

    for (const path of possiblePaths) {
      const value = this.resolveNestedPath(apiData, path);
      if (Array.isArray(value)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract path from placeholder like {{response.data.field}}
   */
  private extractPathFromMapping(mapping: string): string {
    const cleaned = mapping.replace(/\{\{|\}\}/g, '').trim();
    // Remove 'response.' prefix if exists
    return cleaned.replace(/^response\./, '');
  }

  /**
   * Resolve nested path in object
   */
  private resolveNestedPath(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
}
