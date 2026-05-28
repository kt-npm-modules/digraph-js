[![NPM Version](https://img.shields.io/npm/v/%40ktarmyshov%2Fdigraph-js)](https://www.npmjs.com/package/@ktarmyshov/digraph-js)
[![CI](https://github.com/kt-npm-modules/digraph-js/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/kt-npm-modules/digraph-js/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_digraph-js&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_digraph-js)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kt-npm-modules_digraph-js&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kt-npm-modules_digraph-js)

# digraph-js

Yet another graph module.

Based on the idea of https://github.com/antoine-coulon/digraph-js

Make Directed Graphs traversal and construction effortless, also includes deep circular dependency detection.

# Functionality split

## DiGraph

DiGraph class takes care of only managing the vertices, edges, and bound bodies to vertices and edges.

```ts
const digraph = new DiGraph<Vertex, Edge>();
const vertexA: VertexWithId<Vertex> = { id: 'a', vertex: {} };
const vertexE: VertexWithId<Vertex> = { id: 'e', vertex: {} };
const vertexB: VertexWithId<Vertex> = { id: 'b', vertex: {} };

digraph.addVertices(vertexA, vertexB, vertexE);
digraph.addEdges({ from: vertexE.id, to: vertexA.id });
digraph.getDescendantIds(someId);
digraph.getDescendants(someId);
digraph.getAncestorIds(someId);
digraph.getAncestors(someId);
```

## Traversal

Traversal functionality is for different traversion over the graph: DFS, BFS, deep descendants, deep ancestors

```ts
// BFS
let bfs = GraphTraversal.bfs(graph);
// Traverse over ids of vertices
const ids = bfs.traverseIds();
const ids = bfs.traverseIds({ startVertexId: '1' });
const ids = bfs.traverseIds({ startVertexId: '1', depthLimit: 2 });
// Traverse over nodes as {id, vertex}
const verticesWithIds = bfs.traverse();
const verticesWithIds = bfs.traverse({ startVertexId: '1' });
const verticesWithIds = bfs.traverse({ startVertexId: '1', depthLimit: 2 });

// DFS
let dfs = GraphTraversal.dfs(graph);

// Deep descendants
const childrenIds = DescendantTraversal.getDeepDescendantIds(graph, '1');
const children = DescendantTraversal.getDeepDescendant(graph, '1');
const ancestorsIds = AncestorTraversal.getDeepAncestorIds(graph, '4');
const ancestors = AncestorTraversal.getDeepAncestor(graph, '4');
```

## Paths

Functionality for detecting all paths from a given vertex. Supports `depthLimit`.

Paths that contain cycles include the node that closes the cycle at the end e.g. `['a', 'b', 'c', 'b']`.

```ts
it('should return all paths from a given vertex, depthLimit = INFINITY', ({ expect }) => {
	const graph = new DiGraph<Vertex>();
	const vertices = [...createRawVertices('1', '2', '3', '4', '5', '6', '7', '8', '9', '10')];
	graph.addVertices(...vertices);
	graph.addEdges({ from: '1', to: '2' });
	graph.addEdges({ from: '2', to: '3' });
	graph.addEdges({ from: '3', to: '4' });
	graph.addEdges({ from: '1', to: '5' });
	graph.addEdges({ from: '5', to: '6' });
	graph.addEdges({ from: '6', to: '7' });
	graph.addEdges({ from: '5', to: '8' });
	graph.addEdges({ from: '1', to: '9' });
	graph.addEdges({ from: '9', to: '10' });
	graph.addEdges({ from: '10', to: '4' });
	const paths = new GraphPaths(graph);
	const result = [...paths.getPathsFrom('1')];
	const expected = [
		['1', '2', '3', '4'],
		['1', '5', '6', '7'],
		['1', '5', '8'],
		['1', '9', '10', '4']
	];
	expect(result).toEqual(expected);
});
it('should return all paths from a given vertex, depthLimit = 3', ({ expect }) => {
	const graph = new DiGraph<Vertex>();
	const vertices = [...createRawVertices('1', '2', '3', '4', '5', '6', '7', '8', '9', '10')];
	graph.addVertices(...vertices);
	graph.addEdges({ from: '1', to: '2' });
	graph.addEdges({ from: '2', to: '3' });
	graph.addEdges({ from: '3', to: '4' });
	graph.addEdges({ from: '1', to: '5' });
	graph.addEdges({ from: '5', to: '6' });
	graph.addEdges({ from: '6', to: '7' });
	graph.addEdges({ from: '5', to: '8' });
	graph.addEdges({ from: '1', to: '9' });
	graph.addEdges({ from: '9', to: '10' });
	graph.addEdges({ from: '10', to: '4' });
	const paths = new GraphPaths(graph);
	const result = [...paths.getPathsFrom('1', 2)];
	const expected = [
		['1', '2', '3'],
		['1', '5', '6'],
		['1', '5', '8'],
		['1', '9', '10']
	];
	expect(result).toEqual(expected);
});
it('should return all paths from a given vertex, depthLimit = INFINITY, with cycles', ({
	expect
}) => {
	const graph = new DiGraph<Vertex>();
	const vertices = [...createRawVertices('1', '2', '3', '4', '5', '6', '7', '8', '9', '10')];
	graph.addVertices(...vertices);
	graph.addEdges({ from: '1', to: '2' });
	graph.addEdges({ from: '2', to: '3' });
	graph.addEdges({ from: '3', to: '4' });
	graph.addEdges({ from: '1', to: '5' });
	graph.addEdges({ from: '5', to: '6' });
	graph.addEdges({ from: '6', to: '7' });
	graph.addEdges({ from: '5', to: '8' });
	graph.addEdges({ from: '1', to: '9' });
	graph.addEdges({ from: '9', to: '10' });
	graph.addEdges({ from: '10', to: '4' });
	graph.addEdges({ from: '4', to: '1' }); // Adding a cycle
	graph.addEdges({ from: '2', to: '1' }); // Adding a cycle
	const paths = new GraphPaths(graph);
	const result = [...paths.getPathsFrom('1')];
	const expected = [
		['1', '2', '3', '4', '1'],
		['1', '2', '1'],
		['1', '5', '6', '7'],
		['1', '5', '8'],
		['1', '9', '10', '4', '1']
	];
	expect(result).toEqual(expected);
});
it('should return empty paths from a given vertex, without edges - paths with just one vertex are not emitted', ({
	expect
}) => {
	const graph = new DiGraph<Vertex>();
	const vertices = [...createRawVertices('1', '2', '3', '4', '5', '6', '7', '8', '9', '10')];
	graph.addVertices(...vertices);
	graph.addEdges({ from: '1', to: '2' });
	graph.addEdges({ from: '2', to: '3' });
	const paths = new GraphPaths(graph);
	const result = [...paths.getPathsFrom('1', 1)];
	const expected: string[][] = [['1', '2']];
	expect(result).toEqual(expected);
});
```

## Cycles

Functionality for detecting cycles in the graph.

```ts
// Classical DFS graph cycle detection, only one cycle (if any) per node is detected, supports depthLimit
const cycles = new CyclesDFS(graph);
expect(cycles.hasCycles(1)).to.equal(false);
expect(cycles.hasCycles(2)).to.equal(true);
const foundCycles = Array.from(cycles.findCycles(2));
expect(foundCycles).to.deep.equal([['a', 'c']]);

// Johnson's cycle detection, supposedly most performant of existing, does not support depthLimit
// All elementary cycles are detected, multiple cycles per node possible
// https://www.cs.tufts.edu/comp/150GA/homeworks/hw1/Johnson%2075.PDF
// https://epubs.siam.org/doi/10.1137/0205007
const cycles = new CyclesJohnson(digraph);
digraph.addEdges({ from: vertexD.id, to: vertexA.id });
expect(cycles.hasCycles()).to.equal(true);
const foundCycles = Array.from(cycles.findCycles());
expect(foundCycles).to.deep.equal([['a', 'b', 'c', 'd']]);
```

### Benchmark

For sample benchmarking, refer to the [webpack cycle detection benchmark script](./benchmarks/webpack/find-cycles.js).

To perform benchmarks on a wide graph, we use webpack which is probably one of the largest open source Node.js codebase. `./webpack.json` is the file representing the whole webpack graph, built by [skott](https://github.com/antoine-coulon/skott).

`Apple M1 Max`

```bash
Vertices added:  560
Edges added:  2004
----------------------------------------
Started webpack benchmark with cycle detection = INFINITY (Johnson)
Has cycles:  true
Cycles found:  127988
Duration (seconds):  9.648516041999999
Duplicates:  0
Unique cycles:  127988
Longest cycle:  33
----------------------------------------
Started webpack benchmark with cycle detection = INFINITY (DFS)
Has cycles:  true
Cycles found:  164
Duration (seconds):  0.001205959000000803
Duplicates:  0
Unique cycles:  164
Longest cycle:  16
----------------------------------------
Started webpack benchmark with cycle detection = 500
Has cycles:  true
Cycles found:  164
Duration (seconds):  0.0009284170000009908
Duplicates:  0
Unique cycles:  164
Longest cycle:  16
----------------------------------------
Started webpack benchmark with cycle detection = 100
Has cycles:  true
Cycles found:  164
Duration (seconds):  0.0007668749999993451
Duplicates:  0
Unique cycles:  164
Longest cycle:  16
----------------------------------------
Started webpack benchmark with cycle detection = 20
Has cycles:  true
Cycles found:  164
Duration (seconds):  0.000835291999999754
Duplicates:  0
Unique cycles:  164
Longest cycle:  16
----------------------------------------
Started webpack benchmark with cycle detection = 10
Has cycles:  true
Cycles found:  143
Duration (seconds):  0.0018060420000001614
Duplicates:  0
Unique cycles:  143
Longest cycle:  7
```
