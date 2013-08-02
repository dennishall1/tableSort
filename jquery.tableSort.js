/*! Simple jQuery table plugin
 * Copyright (c) 2012 Joseph McCullough (https://github.com/joequery)
 *
 * MIT licensed:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy   
 * of this software and associated documentation files (the "Software"), to deal   
 * in the Software without restriction, including without limitation the rights   
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell   
 * copies of the Software, and to permit persons to whom the Software is   
 * furnished to do so, subject to the following conditions:  
 * 
 * The above copyright notice and this permission notice shall be included in all  
 * copies or substantial portions of the Software.  
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR   
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
 * SOFTWARE.
 *
**/

// Call on a table
// sortFns: Sort functions for your datatypes.
(function($) {

  $.fn.tableSort = function(sortFns) {
		return this.each(function() {
			var $table = $(this);

			// ==================================================== //
			//                  Utility functions                   //
			// ==================================================== //

			// Merge sort functions with some default sort functions.
			sortFns = $.extend({}, {
				"int": function(a, b) {
					return parseInt(a, 10) - parseInt(b, 10);
				},
				"float": function(a, b) {
					return parseFloat(a) - parseFloat(b);
				},
				"string": function(a, b) {
					if (a < b) return -1;
					if (a > b) return +1;
					return 0;
				},
				"string-ins": function(a, b) {
					a = a.toLowerCase();
					b = b.toLowerCase();
					if (a < b) return -1;
					if (a > b) return +1;
					return 0;
				}
			}, sortFns || {});

			// Return the resulting indexes of a sort so we can apply
			// this result elsewhere. This returns an array of index numbers.
			// return[0] = x means "arr's 0th element is now at x"
			var sort_map = function(arr, sort_function, reverse_column) {
				var map = [];
				var index = 0;
				if (reverse_column) {
					for (var i = arr.length-1; i >= 0; i--) {
						map.push(i);
					}
				}
				else {
					var sorted = arr.slice(0).sort(sort_function);
					for (var i=0; i<arr.length; i++) {
						index = $.inArray(arr[i], sorted);

						// If this index is already in the map, look for the next index.
						// This handles the case of duplicate entries.
						while ($.inArray(index, map) != -1) {
							index++;
						}
						map.push(index);
					}
				}
				return map;
			};

			// Apply a sort map to the array.
			var apply_sort_map = function(arr, map) {
				var clone = arr.slice(0),
						newIndex = 0;
				for (var i=0; i<map.length; i++) {
					newIndex = map[i];
					clone[newIndex] = arr[i];
				}
				return clone;
			};

			// ==================================================== //
			//                  Begin execution!                    //
			// ==================================================== //

			// add another method of calling sorting functionality
			// -- required for ipad classic.
			$table.on('tablesort', function(e, th){
				clickHandler.call(th);
			});

			function clickHandler () {
				var trs = $table.find(">tbody>tr");
				var $this = $(this);
				var th_index = 0;
				var dir = $.fn.tableSort.dir;

				$table.find("th").slice(0, $this.index()).each(function() {
					var cols = $(this).attr("colspan") || 1;
					th_index += parseInt(cols, 10);
				});

				// Determine (and/or reverse) sorting direction, default `asc`
				var sort_dir = $this.data("sort-dir") === dir.ASC ? dir.DESC : dir.ASC;

				// Choose appropriate sorting function. If we're sorting descending, check
				// for a `data-sort-desc` attribute.
				if ( sort_dir == dir.DESC )
					var type = $this.data("sort-desc") || $this.data("sort") || null;
				else
					var type = $this.data("sort") || null;

				// Prevent sorting if no type defined
				if (type === null) {
					return;
				}

				// Trigger `beforetablesort` event that calling scripts can hook into;
				// pass parameters for sorted column index and sorting direction
				$table.trigger("beforetablesort", {column: th_index, direction: sort_dir});
				// More reliable method of forcing a redraw
				$table.css("display");

				// Run sorting asynchronously on a timout to force browser redraw after
				// `beforetablesort` callback. Also avoids locking up the browser too much.
				setTimeout(function() {
					// Gather the elements for this column
					var column = [];
					var sortMethod = sortFns[type];

					// Push either the value of the `data-order-by` attribute if specified
					// or just the text() value in this column to column[] for comparison.
					trs.each(function() {
						var $e = $(this).children().eq(th_index);
						var sort_val = $e.data("sort-value");
						var order_by = typeof(sort_val) !== "undefined" ? sort_val : $e.text();
						column.push(order_by);
					});

					// Create the sort map. This column having a sort-dir implies it was
					// the last column sorted. As long as no data-sort-desc is specified,
					// we're free to just reverse the column.
					var reverse_column = !!$this.data("sort-dir") && !$this.data("sort-desc");
					var theMap = sort_map(column, sortMethod, reverse_column);

					// Reset siblings
					$table.find("th").data("sort-dir", null).removeClass("sorting-desc sorting-asc");
					$this.data("sort-dir", sort_dir).addClass("sorting-"+sort_dir);

					// Replace the content of tbody with the sortedTRs. Strangely (and
					// conveniently!) enough, .append accomplishes this for us.
					var sortedTRs = $(apply_sort_map(trs, theMap));
					// added next 3 lines to support ie8, once ie8 is dropped, following 3 lines can be removed
					sortedTRs.each(function(i, tr){
						$(tr).toggleClass('even', !!(i&1));
					});
					$table.children("tbody").append(sortedTRs);

					// Trigger `aftertablesort` event. Similar to `beforetablesort`
					$table.trigger("aftertablesort", {column: th_index, direction: sort_dir});
					// More reliable method of forcing a redraw
					$table.css("display");
				}, 10);
			}

			// Do sorting when THs are clicked
			$table.on("click", "th", clickHandler);

		});
	};

	// Enum containing sorting directions
	$.fn.tableSort.dir = {ASC: "asc", DESC: "desc"};

})(jQuery);
