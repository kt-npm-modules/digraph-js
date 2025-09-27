import { DiGraphDict, EdgeId, EdgeWithId, IDiGraph, VertexWithId } from './interface';

export class DiGraph<Vertex = never, Edge = never> implements IDiGraph<Vertex, Edge> {
	public static fromDict<Vertex, Edge>(dict: DiGraphDict<Vertex, Edge>): DiGraph<Vertex, Edge> {
		const graph = new DiGraph<Vertex, Edge>();

		// Add vertices first
		for (const [id, vertexBody] of Object.entries(dict.vertices)) {
			if (vertexBody === null || vertexBody === undefined) {
				// No vertex body
				graph.addVertices({ id } as VertexWithId<Vertex>);
			} else {
				// Has vertex body
				graph.addVertices({ id, vertex: vertexBody } as VertexWithId<Vertex>);
			}
		}

		// Now add edges
		for (const [from, edgesMap] of Object.entries(dict.edges)) {
			for (const [to, edgeBody] of Object.entries(edgesMap)) {
				if (edgeBody === null) {
					// No edge body
					graph.addEdges({ from, to } as EdgeWithId<Edge>);
				} else {
					// Has edge body
					graph.addEdges({ from, to, edge: edgeBody } as EdgeWithId<Edge>);
				}
			}
		}

		return graph;
	}

	toDict(): DiGraphDict<Vertex, Edge> {
		const vertices: Record<string, Vertex | null> = {};
		const edges: Record<string, Record<string, Edge | null>> = {};

		// Handle vertices - convert undefined to null for JSON serialization
		for (const [id, vertex] of this.#vertices.entries()) {
			vertices[id] = vertex === undefined ? null : vertex;
		}

		// Handle edges - convert undefined to null for JSON serialization
		for (const [from, edgesMap] of this.#edges.entries()) {
			edges[from] = {};
			for (const [to, edge] of edgesMap.entries()) {
				edges[from][to] = edge === undefined ? null : edge;
			}
		}

		return { vertices, edges } as DiGraphDict<Vertex, Edge>;
	}

	readonly #vertices: Map<string, Vertex | undefined> = new Map();
	readonly #edges: Map<string, Map<string, Edge | undefined>> = new Map();

	hasVertex(id: string): boolean {
		return this.#vertices.has(id);
	}
	getVertex(id: string): Vertex | undefined {
		return this.#vertices.get(id);
	}
	protected validateVerticesExist(...ids: string[]): void {
		const nonExistentIds = ids.filter((id) => !this.hasVertex(id));
		if (nonExistentIds.length > 0) {
			throw new Error(`Vertices do not exist in the graph: ${nonExistentIds.join(', ')}`);
		}
	}
	protected validateVerticesDoNotExist(...ids: string[]): void {
		const existentIds = ids.filter((id) => this.hasVertex(id));
		if (existentIds.length > 0) {
			throw new Error(`Vertices already exist in the graph: ${existentIds.join(', ')}`);
		}
	}
	protected validateAddVertices(...ids: string[]): void {
		// Check that there are no duplicate ids in the input
		// If there are, throw an error with the duplicate ids
		const duplicateIds = ids.filter((id, index, array) => array.indexOf(id) !== index);
		if (duplicateIds.length > 0) {
			throw new Error(`Duplicate vertex ids found in the input: ${duplicateIds.join(', ')}`);
		}
		// Check that the vertices do not exist in the graph
		this.validateVerticesDoNotExist(...ids);
	}
	protected validateQueryUpdateDeleteVertices(...ids: string[]): void {
		this.validateVerticesExist(...ids);
	}
	addVertices(...vertices: VertexWithId<Vertex>[]): void {
		this.validateAddVertices(...vertices.map((vertex) => vertex.id));
		// Add the vertices to the graph
		for (const vertex of vertices) {
			this.#vertices.set(vertex.id, vertex.vertex);
		}
	}
	deleteVertices(...ids: string[]): void {
		this.validateQueryUpdateDeleteVertices(...ids);
		for (const id of ids) {
			// Remove all edges that point to this vertex
			for (const parentId of this.getAncestorIds(id)) {
				this.deleteEdges({
					from: parentId,
					to: id
				});
			}
			// Remove all edges that point from this vertex
			this.#edges.delete(id);
			// Remove the vertex itself
			this.#vertices.delete(id);
		}
	}
	updateVertex(vertex: VertexWithId<Vertex>): void {
		this.validateQueryUpdateDeleteVertices(vertex.id);
		this.#vertices.set(vertex.id, vertex.vertex);
	}
	*getVertexIds(): Generator<string> {
		for (const id of this.#vertices.keys()) {
			yield id;
		}
	}
	hasEdge(edgeId: EdgeId): boolean {
		return this.#edges.get(edgeId.from)?.has(edgeId.to) ?? false;
	}
	getEdge({ from, to }: EdgeId): Edge | undefined {
		return this.#edges.get(from)?.get(to);
	}
	protected validateEdgesExist(...edgeIds: EdgeId[]): void {
		const nonExistentEdges = edgeIds.filter((edgeId) => !this.hasEdge(edgeId));
		if (nonExistentEdges.length > 0) {
			const edgeList = nonExistentEdges
				.map((edgeId) => `${edgeId.from} -> ${edgeId.to}`)
				.join(', ');
			throw new Error(`Edges do not exist in the graph: ${edgeList}`);
		}
	}
	protected validateEdgesDoNotExist(...edgeIds: EdgeId[]): void {
		const existentEdges = edgeIds.filter((edgeId) => this.hasEdge(edgeId));
		if (existentEdges.length > 0) {
			const edgeList = existentEdges.map((edgeId) => `${edgeId.from} -> ${edgeId.to}`).join(', ');
			throw new Error(`Edges already exist in the graph: ${edgeList}`);
		}
	}
	protected validateAddEdges(...edges: EdgeWithId<Edge>[]): void {
		// Check that there are no duplicate ids in the input
		// If there are, throw an error with the duplicate ids
		const duplicateIds = edges
			.map((edge) => `${edge.from}->${edge.to}`)
			.filter((id, index, array) => array.indexOf(id) !== index);
		if (duplicateIds.length > 0) {
			throw new Error(`Duplicate edge ids found in the input: ${duplicateIds.join(', ')}`);
		}
		// Check that there are no self-loops
		const selfLoops = edges.filter((edge) => edge.from === edge.to);
		if (selfLoops.length > 0) {
			const selfLoopEdges = selfLoops.map((edge) => `${edge.from} -> ${edge.to}`).join(', ');
			throw new Error('Self-loops are not allowed: ' + selfLoopEdges);
		}
		// Check that the edges do not point to non-existent vertices
		const nonExistentVertices = edges
			.map((edge) => [edge.from, edge.to])
			.flat()
			.filter((id) => !this.hasVertex(id));
		if (nonExistentVertices.length > 0) {
			const nonExistentVerticesList = nonExistentVertices.map((id) => id).join(', ');
			throw new Error('Edges point to non-existent vertices: ' + nonExistentVerticesList);
		}
		// Check that the edges do not exist in the graph
		this.validateEdgesDoNotExist(...edges.map((edge) => ({ from: edge.from, to: edge.to })));
	}
	protected validateQueryUpdateDeleteEdges(...edges: EdgeId[]): void {
		this.validateEdgesExist(...edges);
	}
	addEdges(...edges: EdgeWithId<Edge>[]): void {
		this.validateAddEdges(...edges);
		// Add the edges to the graph
		for (const edge of edges) {
			// Create a new map for the edges if it doesn't exist
			let fromEdges = this.#edges.get(edge.from);
			if (!fromEdges) {
				fromEdges = new Map();
				this.#edges.set(edge.from, fromEdges);
			}
			// Add the edge to the map
			fromEdges.set(edge.to, edge.edge);
		}
	}
	deleteEdges(...edgeIds: EdgeId[]): void {
		this.validateQueryUpdateDeleteEdges(...edgeIds);
		for (const { from, to } of edgeIds) {
			const fromEdges = this.#edges.get(from);
			if (fromEdges) {
				fromEdges.delete(to);
				if (fromEdges.size === 0) {
					this.#edges.delete(from);
				}
			}
		}
	}
	updateEdge(edge: EdgeWithId<Edge>): void {
		this.validateQueryUpdateDeleteEdges(edge);
		this.#edges.get(edge.from)?.set(edge.to, edge.edge);
	}
	*getEdgeIds(): Generator<EdgeId> {
		for (const [from, edges] of this.#edges.entries()) {
			for (const to of edges.keys()) {
				yield { from, to };
			}
		}
	}
	*getDescendantIds(id: string): Generator<string> {
		this.validateQueryUpdateDeleteVertices(id);
		for (const childId of this.#edges.get(id)?.keys() ?? []) {
			yield childId;
		}
	}
	*getDescendants(vertexId: string): Generator<VertexWithId<Vertex>> {
		for (const childId of this.getDescendantIds(vertexId)) {
			yield { id: childId, vertex: this.getVertex(childId) } as VertexWithId<Vertex>;
		}
	}
	*getAncestorIds(id: string): Generator<string> {
		this.validateQueryUpdateDeleteVertices(id);
		for (const [parentId, edges] of this.#edges.entries()) {
			if (edges.has(id)) {
				yield parentId;
			}
		}
	}
	*getAncestors(id: string): Generator<VertexWithId<Vertex>> {
		for (const parentId of this.getAncestorIds(id)) {
			yield { id: parentId, vertex: this.getVertex(parentId) } as VertexWithId<Vertex>;
		}
	}
}
