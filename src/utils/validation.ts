/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrategySchema } from '../schemas/strategySchema';

export const validateStrategy = (data: any) => {
    try {
        StrategySchema.parse(data);
        return { valid: true, errors: null };
    } catch (e) {
        // Check if 'e' has a property 'errors'
        if (typeof e === "object" && e !== null && "errors" in e) {
            // Now TypeScript knows 'e' is an object with a property 'errors', but you might want to further assert the shape of 'e'
            return { valid: false, errors: (e as any).errors };
        }
        // Handle the case where 'e' does not match the expected structure
        return { valid: false, errors: ["An unexpected error occurred"] };
    }
}
