import { describe, expect, it } from 'vitest';
import {
	AncestorTraversal,
	DescendantTraversal,
	DiGraph,
	GraphTraversal,
	VertexWithId
} from '../src/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = Record<string, any>;

function* createRawVertices(...ids: string[]): Generator<VertexWithId<Vertex>> {
	for (const id of ids) {
		yield {
			id,
			vertex: {}
		};
	}
}

describe('Graph traversal', () => {
	describe('When providing a root vertex', () => {
		it('Should fail when the provided vertex does not exist', () => {
			const graph = new DiGraph<Vertex>();
			const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];
			graph.addVertices(vertexA, vertexB, vertexC, vertexD);
			const bfs = GraphTraversal.bfs(graph);
			expect(() => Array.from(bfs.traverse({ startVertexId: 'e' }))).to.throw(
				'Vertex does not exist in the graph: e'
			);
			const dfs = GraphTraversal.dfs(graph);
			expect(() => Array.from(dfs.traverse({ startVertexId: 'e' }))).to.throw(
				'Vertex does not exist in the graph: e'
			);
		});
		it('Should traverse the graph in BFS order', () => {
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

			let bfs = GraphTraversal.bfs(graph);
			expect(Array.from(bfs.traverseIds({ startVertexId: '1' }))).to.deep.equal([
				'1',
				'2',
				'5',
				'9',
				'3',
				'6',
				'8',
				'10',
				'4',
				'7'
			]);
			expect(Array.from(bfs.traverse({ startVertexId: '1' })).map((v) => v.id)).to.deep.equal([
				'1',
				'2',
				'5',
				'9',
				'3',
				'6',
				'8',
				'10',
				'4',
				'7'
			]);
			bfs = GraphTraversal.bfs(graph);
			expect(Array.from(bfs.traverseIds({ startVertexId: '1', depthLimit: 1 }))).to.deep.equal([
				'1',
				'2',
				'5',
				'9'
			]);
		});
		it('Should traverse the graph in DFS order', () => {
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

			let dfs = GraphTraversal.dfs(graph);
			expect(Array.from(dfs.traverseIds({ startVertexId: '1' }))).to.deep.equal([
				'1',
				'2',
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'10'
			]);
			expect(Array.from(dfs.traverse({ startVertexId: '1' })).map((v) => v.id)).to.deep.equal([
				'1',
				'2',
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'10'
			]);
			dfs = GraphTraversal.dfs(graph);
			expect(Array.from(dfs.traverseIds({ startVertexId: '1', depthLimit: 1 }))).to.deep.equal([
				'1',
				'2',
				'5',
				'9'
			]);
		});
	});
	describe('When not providing a root vertex', () => {
		it('Should traverse the graph in BFS order', () => {
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

			const bfs = GraphTraversal.bfs(graph);
			expect(Array.from(bfs.traverseIds())).to.deep.equal([
				'1',
				'2',
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'10'
			]);
		});
		it('Should traverse the graph in DFS order', () => {
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

			const dfs = GraphTraversal.dfs(graph);
			expect(Array.from(dfs.traverseIds())).to.deep.equal([
				'1',
				'2',
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'10'
			]);
		});
	});
	describe('When traversing descendants', () => {
		it('Should traverse the graph children (in BFS order)', () => {
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

			const childrenIds = DescendantTraversal.getDeepDescendantIds(graph, '1');
			const expectedChildrenIds = ['2', '5', '9', '3', '6', '8', '10', '4', '7'];
			expect(Array.from(childrenIds).sort()).to.deep.equal(expectedChildrenIds.sort());
			const children = DescendantTraversal.getDeepDescendants(graph, '1');
			expect(
				Array.from(children)
					.map((v) => v.id)
					.sort()
			).to.deep.equal(expectedChildrenIds.sort());
		});
	});
	describe('When traversing ancestors', () => {
		it('Should traverse the graph ancestors (in BFS order)', () => {
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

			const ancestorsIds = AncestorTraversal.getDeepAncestorIds(graph, '4');
			expect(Array.from(ancestorsIds).sort()).to.deep.equal(['3', '10', '2', '9', '1'].sort());
			const ancestors = AncestorTraversal.getDeepAncestors(graph, '4');
			expect(
				Array.from(ancestors)
					.map((v) => v.id)
					.sort()
			).to.deep.equal(['3', '10', '2', '9', '1'].sort());
		});
	});
	describe('When traversing the graph', () => {
		describe('When searching for all dependencies DEPENDING ON a given vertex', () => {
			describe('When cycles are in the graph', () => {
				it('should deeply explore all vertices anyway', () => {
					const digraph = new DiGraph<Vertex, never>();
					const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
						...createRawVertices('a', 'b', 'c', 'd', 'e', 'f')
					];

					digraph.addVertices(vertexF, vertexC, vertexD, vertexA, vertexB, vertexE);
					digraph.addEdges({ from: vertexF.id, to: vertexA.id });
					digraph.addEdges({ from: vertexB.id, to: vertexA.id });
					digraph.addEdges({ from: vertexD.id, to: vertexA.id });
					digraph.addEdges({ from: vertexC.id, to: vertexB.id });
					digraph.addEdges({ from: vertexE.id, to: vertexD.id });

					// cycle
					digraph.addEdges({ from: vertexC.id, to: vertexF.id });
					digraph.addEdges({ from: vertexF.id, to: vertexC.id });

					const ancestorIds = Array.from(AncestorTraversal.getDeepAncestorIds(digraph, vertexA.id));

					expect(ancestorIds.sort()).deep.equal(['f', 'c', 'd', 'e', 'b'].sort());
				});
			});
		});
		describe('When searching for all dependencies OF a given vertex', () => {
			it('should deeply find and collect all dependencies', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
					...createRawVertices('a', 'b', 'c', 'd', 'e', 'f', 'g')
				];

				digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE, vertexF);
				digraph.addEdges({ from: vertexA.id, to: vertexB.id });
				digraph.addEdges({ from: vertexB.id, to: vertexC.id });
				digraph.addEdges({ from: vertexA.id, to: vertexD.id });
				digraph.addEdges({ from: vertexD.id, to: vertexE.id });
				digraph.addEdges({ from: vertexE.id, to: vertexF.id });

				expect(
					[...DescendantTraversal.getDeepDescendantIds(digraph, vertexA.id)].sort()
				).deep.equal(['b', 'c', 'd', 'e', 'f'].sort());
			});
			describe('When there are cycles in the graph', () => {
				it('scenario n°1: should explore all vertices anyway', () => {
					const digraph = new DiGraph<Vertex>();
					const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
						...createRawVertices('a', 'b', 'c', 'd', 'e', 'f')
					];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE, vertexF);
					digraph.addEdges({ from: vertexA.id, to: vertexB.id });
					digraph.addEdges({ from: vertexB.id, to: vertexC.id });
					digraph.addEdges({ from: vertexA.id, to: vertexD.id });
					digraph.addEdges({ from: vertexD.id, to: vertexE.id });

					// cycle deep in the graph
					digraph.addEdges({ from: vertexE.id, to: vertexF.id });
					digraph.addEdges({ from: vertexF.id, to: vertexE.id });

					const descendantIds = Array.from(
						DescendantTraversal.getDeepDescendantIds(digraph, vertexA.id)
					);

					expect(descendantIds.sort()).deep.equal(['b', 'c', 'd', 'e', 'f'].sort());
				});

				it('scenario n°2: should explore all vertices anyway', () => {
					const digraph = new DiGraph<Vertex>();
					const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
						...createRawVertices('a', 'b', 'c', 'd', 'e', 'f')
					];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE, vertexF);
					digraph.addEdges({ from: vertexA.id, to: vertexF.id });
					digraph.addEdges({ from: vertexA.id, to: vertexB.id });
					digraph.addEdges({ from: vertexA.id, to: vertexD.id });
					digraph.addEdges({ from: vertexD.id, to: vertexE.id });
					digraph.addEdges({ from: vertexB.id, to: vertexC.id });

					// cycle deep in the graph
					digraph.addEdges({ from: vertexC.id, to: vertexF.id });
					digraph.addEdges({ from: vertexF.id, to: vertexC.id });

					const descendantIds = Array.from(
						DescendantTraversal.getDeepDescendantIds(digraph, vertexA.id)
					);
					expect(descendantIds.sort()).deep.equal(['b', 'c', 'd', 'e', 'f'].sort());
				});
			});
		});
	});
});
