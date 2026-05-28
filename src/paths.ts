import { IDiGraph } from './interface.js';

export class GraphPaths<Vertex, Edge> {
	constructor(public readonly graph: IDiGraph<Vertex, Edge>) {}

	*getPathsFrom(
		startVertexId: string,
		depthLimit: number = Number.POSITIVE_INFINITY
	): Generator<string[]> {
		const thisGraph = this.graph;
		function* dfs(
			currentVertex: string,
			path: string[],
			pathSet: Set<string>,
			depth: number
		): Generator<string[]> {
			if (depth > depthLimit) {
				if (path.length > 1) {
					yield [...path]; // Return the current path
				}
				return;
			}

			path.push(currentVertex);
			pathSet.add(currentVertex);

			const neighbors = [...thisGraph.getDescendantIds(currentVertex)];
			if (!neighbors || neighbors.length === 0) {
				// Leaf node
				if (path.length > 1) {
					yield [...path]; // Return the current path
				}
			} else {
				for (const neighbor of neighbors) {
					// Check if this is cycle
					if (pathSet.has(neighbor)) {
						// Cycle detected
						yield [...path, neighbor]; // Return the current path, with cycle
						continue; // Skip to the next neighbor
					}
					// Continue DFS
					yield* dfs(neighbor, path, pathSet, depth + 1);
				}
			}

			// Backtrack
			path.pop();
			pathSet.delete(currentVertex);
		}

		yield* dfs(startVertexId, [], new Set(), 0);
	}
}
