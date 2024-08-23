// Fetch the JSON data
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(40,0)");

        const root = d3.hierarchy(data);
        root.x0 = height / 2;
        root.y0 = 0;

        root.children.forEach(collapse);

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        function update(source) {
            const treeLayout = d3.tree().size([height, width - 160]);
            treeLayout(root);

            const nodes = root.descendants();
            const links = root.links();

            nodes.forEach(d => d.y = d.depth * 180);

            const node = svg.selectAll('g.node')
                .data(nodes, d => d.id || (d.id = ++i));

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${source.y0},${source.x0})`)
                .on('wheel.zoom', function(event, d) {
                    event.preventDefault();
                    if (event.deltaY < 0) { // Zoom in
                        sequentialExpand(d);
                    } else { // Zoom out
                        sequentialCollapse(d);
                    }
                    update(d);
                });

            nodeEnter.append('circle')
                .attr('r', 1e-6)
                .style('fill', d => d._children ? "lightsteelblue" : "#fff");

            nodeEnter.append('text')
                .attr('dy', '.35em')
                .attr('x', d => d.children || d._children ? -13 : 13)
                .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
                .text(d => d.data.name);

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition()
                .duration(750)
                .attr('transform', d => `translate(${d.y},${d.x})`);

            nodeUpdate.select('circle')
                .attr('r', 10)
                .style('fill', d => d._children ? "lightsteelblue" : "#fff");

            nodeUpdate.select('text')
                .style('fill-opacity', 1);

            const nodeExit = node.exit().transition()
                .duration(750)
                .attr('transform', d => `translate(${source.y},${source.x})`)
                .remove();

            nodeExit.select('circle')
                .attr('r', 1e-6);

            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            const link = svg.selectAll('path.link')
                .data(links, d => d.target.id);

            const linkEnter = link.enter().insert('path', 'g')
                .attr('class', 'link')
                .attr('d', d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal(o, o);
                });

            link.merge(linkEnter).transition()
                .duration(750)
                .attr('d', d => diagonal(d.source, d.target));

            link.exit().transition()
                .duration(750)
                .attr('d', d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal(o, o);
                })
                .remove();

            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            function diagonal(s, d) {
                const path = `M ${s.y} ${s.x}
                              C ${(s.y + d.y) / 2} ${s.x},
                                ${(s.y + d.y) / 2} ${d.x},
                                ${d.y} ${d.x}`;
                return path;
            }
        }

        let i = 0;
        update(root);

        function expand(d) {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            if (d.children) {
                d.children.forEach(expand);
            }
        }

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            }
        }

        function sequentialExpand(d) {
            if (d._children) {
                const children = d._children;
                d.children = [];
                d._children = null;

                children.forEach((child, index) => {
                    setTimeout(() => {
                        d.children.push(child);
                        update(d);
                    }, index * 500);
                });
            }
        }

        function sequentialCollapse(d) {
            if (d.children) {
                const children = d.children;
                d._children = [];
                d.children = null;

                children.forEach((child, index) => {
                    setTimeout(() => {
                        d._children.push(child);
                        update(d);
                    }, index * 500);
                });
            }
        }
    });
